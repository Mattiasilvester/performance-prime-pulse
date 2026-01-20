-- ============================================
-- METODO PAGAMENTO ABBONAMENTO E FATTURE
-- Data: 2025-01-22
-- ============================================
-- 
-- Questa migrazione aggiunge:
-- 1. Colonne per metodo di pagamento abbonamento (carta del professionista)
-- 2. Colonne per informazioni abbonamento
-- 3. Tabella subscription_invoices per fatture abbonamenti
-- ============================================

-- Verifica se la tabella professional_settings esiste
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'professional_settings') THEN
        -- ============================================
        -- METODO PAGAMENTO ABBONAMENTO
        -- ============================================
        
        -- Provider attivo (stripe, paypal)
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'professional_settings' 
            AND column_name = 'payment_provider'
        ) THEN
            ALTER TABLE professional_settings 
            ADD COLUMN payment_provider VARCHAR(20);
            
            RAISE NOTICE 'Colonna payment_provider aggiunta a professional_settings';
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'professional_settings' 
            AND column_name = 'stripe_customer_id'
        ) THEN
            ALTER TABLE professional_settings 
            ADD COLUMN stripe_customer_id VARCHAR(255);
            
            RAISE NOTICE 'Colonna stripe_customer_id aggiunta a professional_settings';
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'professional_settings' 
            AND column_name = 'payment_method_id'
        ) THEN
            ALTER TABLE professional_settings 
            ADD COLUMN payment_method_id VARCHAR(255);
            
            RAISE NOTICE 'Colonna payment_method_id aggiunta a professional_settings';
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'professional_settings' 
            AND column_name = 'payment_method_last4'
        ) THEN
            ALTER TABLE professional_settings 
            ADD COLUMN payment_method_last4 VARCHAR(4);
            
            RAISE NOTICE 'Colonna payment_method_last4 aggiunta a professional_settings';
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'professional_settings' 
            AND column_name = 'payment_method_brand'
        ) THEN
            ALTER TABLE professional_settings 
            ADD COLUMN payment_method_brand VARCHAR(20);
            
            RAISE NOTICE 'Colonna payment_method_brand aggiunta a professional_settings';
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'professional_settings' 
            AND column_name = 'payment_method_exp_month'
        ) THEN
            ALTER TABLE professional_settings 
            ADD COLUMN payment_method_exp_month INTEGER;
            
            RAISE NOTICE 'Colonna payment_method_exp_month aggiunta a professional_settings';
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'professional_settings' 
            AND column_name = 'payment_method_exp_year'
        ) THEN
            ALTER TABLE professional_settings 
            ADD COLUMN payment_method_exp_year INTEGER;
            
            RAISE NOTICE 'Colonna payment_method_exp_year aggiunta a professional_settings';
        END IF;

        -- Dati PayPal (se provider = 'paypal')
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'professional_settings' 
            AND column_name = 'paypal_subscription_id'
        ) THEN
            ALTER TABLE professional_settings 
            ADD COLUMN paypal_subscription_id VARCHAR(255);
            
            RAISE NOTICE 'Colonna paypal_subscription_id aggiunta a professional_settings';
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'professional_settings' 
            AND column_name = 'paypal_subscription_email'
        ) THEN
            ALTER TABLE professional_settings 
            ADD COLUMN paypal_subscription_email VARCHAR(255);
            
            RAISE NOTICE 'Colonna paypal_subscription_email aggiunta a professional_settings';
        END IF;

        -- ============================================
        -- INFORMAZIONI ABBONAMENTO
        -- ============================================
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'professional_settings' 
            AND column_name = 'subscription_status'
        ) THEN
            ALTER TABLE professional_settings 
            ADD COLUMN subscription_status VARCHAR(20) DEFAULT 'trial';
            
            RAISE NOTICE 'Colonna subscription_status aggiunta a professional_settings';
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'professional_settings' 
            AND column_name = 'subscription_plan'
        ) THEN
            ALTER TABLE professional_settings 
            ADD COLUMN subscription_plan VARCHAR(20) DEFAULT 'pro';
            
            RAISE NOTICE 'Colonna subscription_plan aggiunta a professional_settings';
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'professional_settings' 
            AND column_name = 'subscription_trial_ends_at'
        ) THEN
            ALTER TABLE professional_settings 
            ADD COLUMN subscription_trial_ends_at TIMESTAMPTZ;
            
            RAISE NOTICE 'Colonna subscription_trial_ends_at aggiunta a professional_settings';
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'professional_settings' 
            AND column_name = 'subscription_current_period_end'
        ) THEN
            ALTER TABLE professional_settings 
            ADD COLUMN subscription_current_period_end TIMESTAMPTZ;
            
            RAISE NOTICE 'Colonna subscription_current_period_end aggiunta a professional_settings';
        END IF;
    ELSE
        RAISE NOTICE 'Tabella professional_settings non trovata. Esegui prima la migrazione principale.';
    END IF;
END $$;

-- ============================================
-- TABELLA FATTURE ABBONAMENTI
-- ============================================

CREATE TABLE IF NOT EXISTS subscription_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  stripe_invoice_id VARCHAR(255),
  invoice_number VARCHAR(50),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',
  status VARCHAR(20) DEFAULT 'paid', -- 'draft', 'open', 'paid', 'void', 'uncollectible'
  description TEXT,
  invoice_pdf_url TEXT,
  invoice_date DATE NOT NULL,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_invoices_professional ON subscription_invoices(professional_id);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON subscription_invoices(invoice_date DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON subscription_invoices(status);

-- RLS Policies
ALTER TABLE subscription_invoices ENABLE ROW LEVEL SECURITY;

-- Rimuovi policy se esiste già (per evitare errori su re-run)
DROP POLICY IF EXISTS "Professionals can view own invoices" ON subscription_invoices;

-- Crea policy
CREATE POLICY "Professionals can view own invoices" ON subscription_invoices
  FOR SELECT USING (
    professional_id IN (
      SELECT id FROM professionals WHERE user_id = auth.uid()
    )
  );

-- Commenti per documentazione
COMMENT ON COLUMN professional_settings.payment_provider IS 'Provider pagamento abbonamento: stripe, paypal';
COMMENT ON COLUMN professional_settings.stripe_customer_id IS 'Stripe Customer ID per billing abbonamento PrimePro';
COMMENT ON COLUMN professional_settings.payment_method_id IS 'Stripe Payment Method ID per carta abbonamento';
COMMENT ON COLUMN professional_settings.payment_method_last4 IS 'Ultime 4 cifre carta o ultimi caratteri metodo';
COMMENT ON COLUMN professional_settings.payment_method_brand IS 'Brand metodo: visa, mastercard, amex, paypal';
COMMENT ON COLUMN professional_settings.payment_method_exp_month IS 'Mese scadenza carta (1-12) - solo per carte';
COMMENT ON COLUMN professional_settings.payment_method_exp_year IS 'Anno scadenza carta - solo per carte';
COMMENT ON COLUMN professional_settings.paypal_subscription_id IS 'PayPal Subscription ID per abbonamento';
COMMENT ON COLUMN professional_settings.paypal_subscription_email IS 'Email PayPal per abbonamento';
COMMENT ON COLUMN professional_settings.subscription_status IS 'Stato abbonamento: trial, active, past_due, cancelled';
COMMENT ON COLUMN professional_settings.subscription_plan IS 'Piano abbonamento: basic, pro, advanced';
COMMENT ON COLUMN professional_settings.subscription_trial_ends_at IS 'Data fine periodo di prova';
COMMENT ON COLUMN professional_settings.subscription_current_period_end IS 'Data fine periodo corrente abbonamento';
COMMENT ON TABLE subscription_invoices IS 'Fatture abbonamenti PrimePro per professionisti';
