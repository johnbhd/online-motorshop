FROM php:8.2-cli

WORKDIR /var/www/html

RUN apt-get update && apt-get install -y \
    git \
    curl \
    unzip \
    libpq-dev \
    && docker-php-ext-install pdo_pgsql pgsql \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

COPY . .

RUN composer install \
    --no-dev \
    --no-interaction \
    --prefer-dist \
    --optimize-autoloader

EXPOSE 8000

CMD ["sh", "-c", "php artisan serve --host=0.0.0.0 --port=${PORT:-8000}"]