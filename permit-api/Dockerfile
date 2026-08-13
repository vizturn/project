# =============================================================================
# Image PHP untuk API Laravel (lingkungan PENGEMBANGAN).
#
# Kontrak dengan docker-compose.yml — tiga hal ini HARUS selaras, kalau tidak
# container hidup tapi tidak melayani apa pun:
#   1. WORKDIR      = /var/www/html   (sama dengan target bind mount './permit-api')
#   2. Port dengar  = 80              (sama dengan publish '${APP_PORT:-80}:80')
#   3. Proses utama = web server      (bukan php-fpm, karena tidak ada nginx
#                                      di compose yang meneruskan ke fpm)
#
# Versi sebelumnya memakai WORKDIR /var/www, EXPOSE 9000, dan CMD php-fpm —
# ketiganya tidak cocok dengan compose. API tetap jalan selama ini hanya karena
# image lama 'permit-api/php83' sudah terlanjur ada di mesin lokal dan Docker
# memakainya tanpa build ulang. Begitu image itu hilang (docker system prune,
# ganti mesin, atau partner build dari nol), API mati tanpa pesan error yang
# jelas. File ini memperbaiki akar masalahnya.
#
# CATATAN PRODUKSI: `php artisan serve` (server bawaan PHP) cocok untuk dev,
# TIDAK untuk produksi. Saat deployment nanti gantilah dengan nginx + php-fpm
# atau FrankenPHP/Octane. Lihat catatan di bagian bawah file.
# =============================================================================

FROM php:8.3-cli

# --- Dependensi sistem & ekstensi PHP -----------------------------------------
# pdo_mysql : koneksi MySQL
# mbstring  : string multibyte (dipakai Laravel di banyak tempat)
# gd        : manipulasi gambar (upload JSA/sertifikat berformat gambar)
# zip       : dibutuhkan Composer
# pcntl     : dibutuhkan `artisan schedule:work` untuk menangani sinyal & timeout
# bcmath    : presisi angka
# exif      : metadata gambar
RUN apt-get update && apt-get install -y --no-install-recommends \
    git curl zip unzip \
    libpng-dev libonig-dev libxml2-dev libzip-dev \
    && docker-php-ext-install pdo pdo_mysql mbstring exif pcntl bcmath gd zip \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY . .

# Dependensi dev (phpunit, pail, pint) SENGAJA ikut dipasang — image ini dipakai
# untuk `docker compose exec api php artisan test`. Untuk image produksi,
# tambahkan --no-dev.
RUN composer install --optimize-autoloader --no-interaction --no-progress

RUN chown -R www-data:www-data storage bootstrap/cache

# Server bawaan PHP default-nya melayani satu permintaan pada satu waktu, jadi
# permintaan yang saling menunggu (mis. frontend memanggil dua endpoint
# sekaligus) bisa terlihat "menggantung". Beberapa worker menghilangkan gejala itu.
ENV PHP_CLI_SERVER_WORKERS=4

EXPOSE 80

CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=80"]
