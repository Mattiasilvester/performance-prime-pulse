-- Migrazione: Aggiungi supporto PayPal a professional_subscriptions e subscription_invoices
-- Data: 28 Gennaio 2025
-- Descrizione: Aggiunge colonne per gestire abbonamenti PayPal come alternativa a Stripe

-- Aggiungi colonne PayPal a professional_subscriptions
DO $$ 
BEGIN
    -- paypal_subscription_id
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'professional_subscriptions' 
        AND column_name = 'paypal_subscription_id'
    ) THEN
        ALTER TABLE professional_subscriptions
        ADD COLUMN paypal_subscription_id TEXT NULL;
        
        COMMENT ON COLUMN professional_subscriptions.paypal_subscription_id IS 
        'ID subscription PayPal';
    END IF;

    -- paypal_plan_id
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'professional_subscriptions' 
        AND column_name = 'paypal_plan_id'
    ) THEN
        ALTER TABLE professional_subscriptions
        ADD COLUMN paypal_plan_id TEXT NULL;
        
        COMMENT ON COLUMN professional_subscriptions.paypal_plan_id IS 
        'ID piano PayPal';
    END IF;

    -- payment_provider
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'professional_subscriptions' 
        AND column_name = 'payment_provider'
    ) THEN
        ALTER TABLE professional_subscriptions
        ADD COLUMN payment_provider VARCHAR(20) DEFAULT 'stripe';
        
        COMMENT ON COLUMN professional_subscriptions.payment_provider IS 
        'Provider pagamento: stripe o paypal';
    END IF;
END $$;

-- Aggiungi colonna PayPal a subscription_invoices
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'subscription_invoices' 
        AND column_name = 'paypal_invoice_id'
    ) THEN
        ALTER TABLE subscription_invoices
        ADD COLUMN paypal_invoice_id TEXT NULL;
        
        COMMENT ON COLUMN subscription_invoices.paypal_invoice_id IS 
        'ID fattura PayPal';
    END IF;
END $$;

-- Crea indice per ricerche PayPal subscription
CREATE INDEX IF NOT EXISTS idx_subscriptions_paypal_id 
  ON professional_subscriptions(paypal_subscription_id) 
  WHERE paypal_subscription_id IS NOT NULL;

-- Crea indice per payment_provider
CREATE INDEX IF NOT EXISTS idx_subscriptions_payment_provider 
  ON professional_subscriptions(payment_provider);
