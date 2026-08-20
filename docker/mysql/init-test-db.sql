-- Membuat basis data khusus pengujian otomatis.
--
-- Berkas ini dijalankan sekali oleh kontainer MySQL saat basis data pertama
-- kali diinisialisasi (volume masih kosong). Tanpa basis data ini, perintah
-- `php artisan test` akan menggantung karena tidak menemukan basis data yang
-- ditetapkan pada phpunit.xml.
--
-- Catatan: pada mesin yang volumenya sudah terlanjur terbentuk, berkas ini
-- TIDAK dijalankan. Basis data pengujian perlu dibuat satu kali secara manual:
--   docker compose exec mysql mysql -uroot -ppassword \
--     -e "CREATE DATABASE IF NOT EXISTS permit_she_test;"

CREATE DATABASE IF NOT EXISTS permit_she_test
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

-- Beri akses penuh atas basis data pengujian kepada root dari host mana pun,
-- mengikuti pengaturan MYSQL_ROOT_HOST pada docker-compose.yml.
GRANT ALL PRIVILEGES ON permit_she_test.* TO 'root'@'%';
FLUSH PRIVILEGES;
