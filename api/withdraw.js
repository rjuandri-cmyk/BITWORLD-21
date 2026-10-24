import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  // Hanya izinkan metode POST
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: "Method Not Allowed" });
  }

  const { wallet_address, amount } = req.body;

  // Validasi input awal
  if (!wallet_address || !amount) {
    return res.status(400).json({ success: false, message: "Alamat wallet dan jumlah penarikan wajib diisi!" });
  }

  const withdrawAmount = parseFloat(amount);

  // 1. Syarat Minimal Penarikan (1.00 BTW)
  if (withdrawAmount < 1.00) {
    return res.status(400).json({ 
      success: false, 
      message: "Gagal: Minimal penarikan adalah 1.00 $BTW!" 
    });
  }

  try {
    // 2. Cek apakah user terdaftar dan ambil status KYC serta saldo internal
    const userResult = await pool.query(
      "SELECT * FROM users WHERE wallet_address = $1", 
      [wallet_address]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Wallet belum terdaftar di sistem!" });
    }

    const user = userResult.rows[0];

    // 3. Syarat Status KYC Wajib 'verified'
    if (user.kyc_status !== 'verified') {
      return res.status(400).json({ 
        success: false, 
        message: "Gagal: Akun kamu harus menyelesaikan verifikasi KYC terlebih dahulu!" 
      });
    }

    // 4. Cek apakah saldo internal user mencukupi
    if (parseFloat(user.internal_points || 0) < withdrawAmount) {
      return res.status(400).json({ 
        success: false, 
        message: "Gagal: Saldo internal poin $BTW kamu tidak mencukupi!" 
      });
    }

    // 5. Hitung Skema Vesting (25% Unlocked, 75% Locked)
    const unlockedAmount = withdrawAmount * 0.25; // 25% langsung cair
    const lockedAmount = withdrawAmount * 0.75;   // 75% dikunci bertahap

    // Mulai transaksi database (Database Transaction)
    await pool.query('BEGIN');

    // Kurangi saldo internal user
    await pool.query(
      "UPDATE users SET internal_points = internal_points - $1 WHERE wallet_address = $2",
      [withdrawAmount, wallet_address]
    );

    // Catat ke tabel riwayat penarikan (withdrawals)
    await pool.query(
      `INSERT INTO withdrawals (wallet_address, total_amount, unlocked_amount, locked_amount, status) 
       VALUES ($1, $2, $3, $4, 'pending')`,
      [wallet_address, withdrawAmount, unlockedAmount, lockedAmount]
    );

    await pool.query('COMMIT');

    return res.status(200).json({
      success: true,
      message: "Permintaan migrasi berhasil diajukan!",
      data: {
        total_requested: withdrawAmount,
        unlocked_25_percent: unlockedAmount,
        locked_75_percent: lockedAmount,
        status: "pending"
      }
    });

  } catch (error) {
    await pool.query('ROLLBACK');
    console.error("Withdraw API Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
