# Menjalankan Pengujian Otomatis

## Basis data pengujian

Pengujian otomatis tidak memakai basis data yang sama dengan aplikasi. Pada
`permit-api/phpunit.xml` ditetapkan basis data tersendiri:

```
DB_DATABASE = permit_she_test
```

Basis data ini **wajib ada sebelum pengujian dijalankan**. Laravel hanya
menjalankan migrasi di dalamnya, tidak membuatkannya.

Apabila basis data belum ada, perintah `php artisan test` akan **menggantung
tanpa pesan kesalahan** karena menunggu sambungan yang tidak pernah berhasil.
Pada kondisi tertentu proses ini sulit dihentikan dan mengharuskan Docker
Desktop dijalankan ulang.

## Pemasangan baru

Tidak perlu langkah tambahan. Berkas `docker/mysql/init-test-db.sql` dijalankan
otomatis oleh kontainer MySQL saat basis data pertama kali dibentuk, sehingga
`permit_she_test` langsung tersedia.

## Pemasangan yang sudah berjalan

Skrip inisialisasi hanya dijalankan ketika volume MySQL masih kosong. Pada mesin
yang volumenya sudah terbentuk sebelum skrip ini ditambahkan, basis data
pengujian perlu dibuat satu kali secara manual:

```bash
docker compose exec mysql mysql -uroot -ppassword \
  -e "CREATE DATABASE IF NOT EXISTS permit_she_test;"
```

Periksa hasilnya:

```bash
docker compose exec mysql mysql -uroot -ppassword -e "SHOW DATABASES;"
```

`permit_she_test` harus muncul pada daftar.

## Menjalankan pengujian

Seluruh pengujian:

```bash
docker compose exec api php artisan test
```

Satu berkas saja (berguna saat menelusuri kegagalan):

```bash
docker compose exec api php artisan test --filter=AuthTest
```

Berhenti pada kegagalan pertama:

```bash
docker compose exec api php artisan test --stop-on-failure
```

## Bagi pengembang tanpa Docker

Buat basis data `permit_she_test` pada MySQL lokal, lalu jalankan pengujian
langsung dari dalam folder `permit-api`:

```bash
php artisan test
```

Pastikan pengaturan sambungan pada `phpunit.xml` sesuai dengan MySQL lokal yang
digunakan.
