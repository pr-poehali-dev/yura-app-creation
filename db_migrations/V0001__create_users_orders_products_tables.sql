-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    phone VARCHAR(50),
    telegram_id BIGINT UNIQUE,
    telegram_username VARCHAR(255),
    role VARCHAR(50) DEFAULT 'customer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(100),
    image_url TEXT,
    sizes TEXT[],
    stock INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    delivery_address TEXT,
    delivery_phone VARCHAR(50),
    payment_method VARCHAR(50),
    telegram_notified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id),
    product_id INTEGER REFERENCES products(id),
    product_name VARCHAR(255),
    product_price DECIMAL(10, 2),
    quantity INTEGER NOT NULL,
    selected_size VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create favorites table
CREATE TABLE IF NOT EXISTS favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    product_id INTEGER REFERENCES products(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
);

-- Insert initial products
INSERT INTO products (name, description, price, category, image_url, sizes, stock) VALUES
('Кожаная сумка Premium', 'Эксклюзивная кожаная сумка ручной работы из натуральной итальянской кожи', 45000.00, 'accessories', 'https://cdn.poehali.dev/projects/783165fc-2771-4037-aad5-40200d4e8e1f/files/47696c94-918b-4d5b-a260-5cd6a16b4b76.jpg', ARRAY['One Size'], 10),
('Шёлковое платье', 'Элегантное платье из натурального шёлка премиум-класса', 89000.00, 'clothing', 'https://cdn.poehali.dev/projects/783165fc-2771-4037-aad5-40200d4e8e1f/files/0776c7de-3b5c-48df-b40b-8fcef6ce91fe.jpg', ARRAY['XS', 'S', 'M', 'L'], 5),
('Ювелирное колье', 'Уникальное колье с драгоценными камнями ручной работы', 125000.00, 'jewelry', 'https://cdn.poehali.dev/projects/783165fc-2771-4037-aad5-40200d4e8e1f/files/b6bf3159-49c5-419b-97ec-a482cfa79626.jpg', ARRAY['One Size'], 3);

-- Create admin user (password: admin123)
INSERT INTO users (email, password_hash, full_name, role) VALUES
('admin@maison.ru', '$2b$10$rG3qY8X9KvZYhZ8X9KvZYeO7qY8X9KvZYhZ8X9KvZYhZ8X9KvZYhZu', 'Администратор', 'admin')
ON CONFLICT (email) DO NOTHING;
