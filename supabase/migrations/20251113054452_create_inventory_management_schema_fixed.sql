/*
  # Create Inventory Management Schema

  1. New Tables
    - `inventory_categories`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `description` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `inventory_items`
      - `id` (uuid, primary key)
      - `category_id` (uuid, foreign key)
      - `item_name` (text)
      - `item_code` (text, unique)
      - `description` (text)
      - `unit` (text) - piece, box, liter, kg, etc.
      - `quantity` (integer)
      - `min_stock_level` (integer)
      - `max_stock_level` (integer)
      - `unit_price` (numeric)
      - `supplier_name` (text)
      - `supplier_contact` (text)
      - `location` (text)
      - `condition` (text) - new, good, fair, poor
      - `status` (text) - available, low_stock, out_of_stock, discontinued
      - `purchase_date` (date)
      - `warranty_expiry` (date)
      - `last_maintenance` (date)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `inventory_transactions`
      - `id` (uuid, primary key)
      - `item_id` (uuid, foreign key)
      - `transaction_type` (text) - purchase, issue, return, adjustment, damage, lost
      - `quantity` (integer)
      - `unit_price` (numeric)
      - `total_amount` (numeric)
      - `issued_to` (uuid, foreign key to profiles)
      - `issued_by` (uuid, foreign key to profiles)
      - `reason` (text)
      - `remarks` (text)
      - `transaction_date` (date)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Policies for authenticated users based on roles
*/

-- Create inventory_categories table
CREATE TABLE IF NOT EXISTS inventory_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create inventory_items table
CREATE TABLE IF NOT EXISTS inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES inventory_categories(id) ON DELETE SET NULL,
  item_name text NOT NULL,
  item_code text UNIQUE NOT NULL,
  description text,
  unit text DEFAULT 'piece',
  quantity integer DEFAULT 0,
  min_stock_level integer DEFAULT 10,
  max_stock_level integer DEFAULT 100,
  unit_price numeric(10,2) DEFAULT 0,
  supplier_name text,
  supplier_contact text,
  location text,
  condition text DEFAULT 'good',
  status text DEFAULT 'available',
  purchase_date date,
  warranty_expiry date,
  last_maintenance date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create inventory_transactions table
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid REFERENCES inventory_items(id) ON DELETE CASCADE,
  transaction_type text NOT NULL,
  quantity integer NOT NULL,
  unit_price numeric(10,2) DEFAULT 0,
  total_amount numeric(10,2) DEFAULT 0,
  issued_to uuid REFERENCES profiles(id) ON DELETE SET NULL,
  issued_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  reason text,
  remarks text,
  transaction_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE inventory_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;

-- Policies for inventory_categories
CREATE POLICY "Anyone authenticated can view categories"
  ON inventory_categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can insert categories"
  ON inventory_categories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can update categories"
  ON inventory_categories FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can delete categories"
  ON inventory_categories FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policies for inventory_items
CREATE POLICY "Anyone authenticated can view items"
  ON inventory_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can insert items"
  ON inventory_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can update items"
  ON inventory_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can delete items"
  ON inventory_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policies for inventory_transactions
CREATE POLICY "Anyone authenticated can view transactions"
  ON inventory_transactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin and professors can insert transactions"
  ON inventory_transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'professor')
    )
  );

CREATE POLICY "Admin can update transactions"
  ON inventory_transactions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can delete transactions"
  ON inventory_transactions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_inventory_items_category_id ON inventory_items(category_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_status ON inventory_items(status);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_item_id ON inventory_transactions(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_type ON inventory_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_date ON inventory_transactions(transaction_date);

-- Create function to update item quantity after transaction
CREATE OR REPLACE FUNCTION update_inventory_quantity()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.transaction_type IN ('purchase', 'return') THEN
    UPDATE inventory_items
    SET quantity = quantity + NEW.quantity,
        updated_at = now()
    WHERE id = NEW.item_id;
  ELSIF NEW.transaction_type IN ('issue', 'damage', 'lost') THEN
    UPDATE inventory_items
    SET quantity = quantity - NEW.quantity,
        updated_at = now()
    WHERE id = NEW.item_id;
  ELSIF NEW.transaction_type = 'adjustment' THEN
    UPDATE inventory_items
    SET quantity = NEW.quantity,
        updated_at = now()
    WHERE id = NEW.item_id;
  END IF;
  
  -- Update status based on stock levels
  UPDATE inventory_items
  SET status = CASE
    WHEN quantity = 0 THEN 'out_of_stock'
    WHEN quantity <= min_stock_level THEN 'low_stock'
    ELSE 'available'
  END
  WHERE id = NEW.item_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS inventory_transaction_trigger ON inventory_transactions;
CREATE TRIGGER inventory_transaction_trigger
  AFTER INSERT ON inventory_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_quantity();
