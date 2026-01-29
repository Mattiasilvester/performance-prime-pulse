export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_audit_logs: {
        Row: {
          action: string
          admin_id: string | null
          created_at: string | null
          details: Json | null
          id: string
          ip_address: string | null
          target_user_id: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_audit_logs_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_sessions: {
        Row: {
          admin_id: string | null
          created_at: string | null
          expires_at: string
          id: string
          token: string
        }
        Insert: {
          admin_id?: string | null
          created_at?: string | null
          expires_at: string
          id?: string
          token: string
        }
        Update: {
          admin_id?: string | null
          created_at?: string | null
          expires_at?: string
          id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_sessions_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_settings: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "admin_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_reminders: {
        Row: {
          booking_id: string
          hours_before: number
          id: string
          notification_id: string | null
          professional_id: string
          sent_at: string | null
        }
        Insert: {
          booking_id: string
          hours_before: number
          id?: string
          notification_id?: string | null
          professional_id: string
          sent_at?: string | null
        }
        Update: {
          booking_id?: string
          hours_before?: number
          id?: string
          notification_id?: string | null
          professional_id?: string
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_reminders_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_reminders_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "professional_notifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_reminders_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          booking_date: string
          booking_time: string
          cancellation_reason: string | null
          cancelled_at: string | null
          client_email: string | null
          client_name: string | null
          client_phone: string | null
          color: string | null
          confirmed_at: string | null
          created_at: string | null
          duration_minutes: number | null
          id: string
          modalita: string | null
          notes: string | null
          price: number | null
          professional_id: string
          service_id: string | null
          service_type: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          booking_date: string
          booking_time: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          client_email?: string | null
          client_name?: string | null
          client_phone?: string | null
          color?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          modalita?: string | null
          notes?: string | null
          price?: number | null
          professional_id: string
          service_id?: string | null
          service_type?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          booking_date?: string
          booking_time?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          client_email?: string | null
          client_name?: string | null
          client_phone?: string | null
          color?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          modalita?: string | null
          notes?: string | null
          price?: number | null
          professional_id?: string
          service_id?: string | null
          service_type?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "professional_services"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          is_pp_subscriber: boolean | null
          notes: string | null
          phone: string | null
          professional_id: string
          session_price: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name: string
          id?: string
          is_pp_subscriber?: boolean | null
          notes?: string | null
          phone?: string | null
          professional_id: string
          session_price?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          is_pp_subscriber?: boolean | null
          notes?: string | null
          phone?: string | null
          professional_id?: string
          session_price?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_workouts: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string
          exercises: Json
          id: string
          scheduled_date: string
          title: string
          total_duration: number | null
          updated_at: string
          user_id: string
          workout_type: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          exercises?: Json
          id?: string
          scheduled_date: string
          title: string
          total_duration?: number | null
          updated_at?: string
          user_id: string
          workout_type: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          exercises?: Json
          id?: string
          scheduled_date?: string
          title?: string
          total_duration?: number | null
          updated_at?: string
          user_id?: string
          workout_type?: string
        }
        Relationships: []
      }
      health_disclaimer_acknowledgments: {
        Row: {
          acknowledged: boolean | null
          acknowledged_at: string | null
          context: Json | null
          created_at: string | null
          disclaimer_type: string
          id: string
          user_id: string | null
        }
        Insert: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          context?: Json | null
          created_at?: string | null
          disclaimer_type: string
          id?: string
          user_id?: string | null
        }
        Update: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          context?: Json | null
          created_at?: string | null
          disclaimer_type?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      monthly_workout_stats: {
        Row: {
          created_at: string
          id: string
          month: string
          total_hours: number
          total_workouts: number
          user_id: string
          year: number
        }
        Insert: {
          created_at?: string
          id?: string
          month: string
          total_hours?: number
          total_workouts?: number
          user_id: string
          year: number
        }
        Update: {
          created_at?: string
          id?: string
          month?: string
          total_hours?: number
          total_workouts?: number
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      notes: {
        Row: {
          content: string
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      onboarding_analytics: {
        Row: {
          completed_at: string | null
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          started_at: string
          step_name: string
          step_number: number
          time_spent_seconds: number | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          started_at?: string
          step_name: string
          step_number: number
          time_spent_seconds?: number | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          started_at?: string
          step_name?: string
          step_number?: number
          time_spent_seconds?: number | null
          user_id?: string
        }
        Relationships: []
      }
      onboarding_esperienza: {
        Row: {
          created_at: string
          giorni_settimana: number
          id: string
          livello_esperienza: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          giorni_settimana: number
          id?: string
          livello_esperienza: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          giorni_settimana?: number
          id?: string
          livello_esperienza?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      onboarding_obiettivo_principale: {
        Row: {
          created_at: string
          id: string
          obiettivo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          obiettivo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          obiettivo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      onboarding_personalizzazione: {
        Row: {
          altezza: number
          consigli_nutrizionali: boolean
          created_at: string
          eta: number
          id: string
          nome: string
          peso: number
          updated_at: string
          user_id: string
        }
        Insert: {
          altezza: number
          consigli_nutrizionali?: boolean
          created_at?: string
          eta: number
          id?: string
          nome: string
          peso: number
          updated_at?: string
          user_id: string
        }
        Update: {
          altezza?: number
          consigli_nutrizionali?: boolean
          created_at?: string
          eta?: number
          id?: string
          nome?: string
          peso?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      onboarding_preferenze: {
        Row: {
          altri_attrezzi: string | null
          attrezzi: string[] | null
          created_at: string
          id: string
          luoghi_allenamento: Json
          possiede_attrezzatura: boolean | null
          tempo_sessione: number
          updated_at: string
          user_id: string
        }
        Insert: {
          altri_attrezzi?: string | null
          attrezzi?: string[] | null
          created_at?: string
          id?: string
          luoghi_allenamento?: Json
          possiede_attrezzatura?: boolean | null
          tempo_sessione: number
          updated_at?: string
          user_id: string
        }
        Update: {
          altri_attrezzi?: string | null
          attrezzi?: string[] | null
          created_at?: string
          id?: string
          luoghi_allenamento?: Json
          possiede_attrezzatura?: boolean | null
          tempo_sessione?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      openai_usage_logs: {
        Row: {
          cost_usd: number | null
          created_at: string | null
          id: string
          message: string | null
          model: string | null
          prompt: string | null
          response: string | null
          tokens_completion: number | null
          tokens_prompt: number | null
          tokens_total: number | null
          tokens_used: number | null
          user_id: string | null
        }
        Insert: {
          cost_usd?: number | null
          created_at?: string | null
          id?: string
          message?: string | null
          model?: string | null
          prompt?: string | null
          response?: string | null
          tokens_completion?: number | null
          tokens_prompt?: number | null
          tokens_total?: number | null
          tokens_used?: number | null
          user_id?: string | null
        }
        Update: {
          cost_usd?: number | null
          created_at?: string | null
          id?: string
          message?: string | null
          model?: string | null
          prompt?: string | null
          response?: string | null
          tokens_completion?: number | null
          tokens_prompt?: number | null
          tokens_total?: number | null
          tokens_used?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      primebot_interactions: {
        Row: {
          bot_intent: string | null
          bot_response: string
          id: string
          interaction_type: string | null
          message_content: string
          response_time_ms: number | null
          session_id: string
          timestamp: string | null
          tokens_used: number | null
          user_context: Json | null
          user_id: string | null
        }
        Insert: {
          bot_intent?: string | null
          bot_response: string
          id?: string
          interaction_type?: string | null
          message_content: string
          response_time_ms?: number | null
          session_id: string
          timestamp?: string | null
          tokens_used?: number | null
          user_context?: Json | null
          user_id?: string | null
        }
        Update: {
          bot_intent?: string | null
          bot_response?: string
          id?: string
          interaction_type?: string | null
          message_content?: string
          response_time_ms?: number | null
          session_id?: string
          timestamp?: string | null
          tokens_used?: number | null
          user_context?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      primebot_preferences: {
        Row: {
          communication_style: string | null
          created_at: string | null
          favorite_topics: string[] | null
          fitness_level: string | null
          goals: string[] | null
          has_trainer: boolean | null
          last_interaction: string | null
          onboarding_completed: boolean | null
          preferred_workout_types: string[] | null
          reminder_frequency: string | null
          subscription_status: string | null
          total_messages: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          communication_style?: string | null
          created_at?: string | null
          favorite_topics?: string[] | null
          fitness_level?: string | null
          goals?: string[] | null
          has_trainer?: boolean | null
          last_interaction?: string | null
          onboarding_completed?: boolean | null
          preferred_workout_types?: string[] | null
          reminder_frequency?: string | null
          subscription_status?: string | null
          total_messages?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          communication_style?: string | null
          created_at?: string | null
          favorite_topics?: string[] | null
          fitness_level?: string | null
          goals?: string[] | null
          has_trainer?: boolean | null
          last_interaction?: string | null
          onboarding_completed?: boolean | null
          preferred_workout_types?: string[] | null
          reminder_frequency?: string | null
          subscription_status?: string | null
          total_messages?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      professional_applications: {
        Row: {
          bio: string | null
          category: string
          city: string
          company_name: string | null
          email: string
          first_name: string
          id: string
          last_name: string
          phone: string
          professional_id: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          specializations: string[] | null
          status: string | null
          submitted_at: string | null
          vat_number: string | null
        }
        Insert: {
          bio?: string | null
          category: string
          city: string
          company_name?: string | null
          email: string
          first_name: string
          id?: string
          last_name: string
          phone: string
          professional_id?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          specializations?: string[] | null
          status?: string | null
          submitted_at?: string | null
          vat_number?: string | null
        }
        Update: {
          bio?: string | null
          category?: string
          city?: string
          company_name?: string | null
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          phone?: string
          professional_id?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          specializations?: string[] | null
          status?: string | null
          submitted_at?: string | null
          vat_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professional_applications_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_availability: {
        Row: {
          day_of_week: number
          end_time: string
          id: string
          is_available: boolean | null
          professional_id: string
          start_time: string
        }
        Insert: {
          day_of_week: number
          end_time: string
          id?: string
          is_available?: boolean | null
          professional_id: string
          start_time: string
        }
        Update: {
          day_of_week?: number
          end_time?: string
          id?: string
          is_available?: boolean | null
          professional_id?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_availability_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_blocked_periods: {
        Row: {
          block_type: string
          created_at: string | null
          end_date: string
          id: string
          professional_id: string
          reason: string | null
          start_date: string
          updated_at: string | null
        }
        Insert: {
          block_type: string
          created_at?: string | null
          end_date: string
          id?: string
          professional_id: string
          reason?: string | null
          start_date: string
          updated_at?: string | null
        }
        Update: {
          block_type?: string
          created_at?: string | null
          end_date?: string
          id?: string
          professional_id?: string
          reason?: string | null
          start_date?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professional_blocked_periods_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_clients: {
        Row: {
          created_at: string | null
          first_contact_date: string | null
          id: string
          last_session_date: string | null
          notes: string | null
          professional_id: string
          status: string | null
          total_sessions: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          first_contact_date?: string | null
          id?: string
          last_session_date?: string | null
          notes?: string | null
          professional_id: string
          status?: string | null
          total_sessions?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          first_contact_date?: string | null
          id?: string
          last_session_date?: string | null
          notes?: string | null
          professional_id?: string
          status?: string | null
          total_sessions?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_clients_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_languages: {
        Row: {
          created_at: string | null
          id: string
          language_code: string
          language_name: string
          professional_id: string
          proficiency_level: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          language_code: string
          language_name: string
          professional_id: string
          proficiency_level: string
        }
        Update: {
          created_at?: string | null
          id?: string
          language_code?: string
          language_name?: string
          professional_id?: string
          proficiency_level?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_languages_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          is_read: boolean | null
          message: string
          professional_id: string
          read_at: string | null
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message: string
          professional_id: string
          read_at?: string | null
          title: string
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message?: string
          professional_id?: string
          read_at?: string | null
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professional_notifications_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_services: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          duration_minutes: number
          id: string
          is_active: boolean | null
          is_in_person: boolean | null
          is_online: boolean | null
          name: string
          price: number
          professional_id: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean | null
          is_in_person?: boolean | null
          is_online?: boolean | null
          name: string
          price: number
          professional_id: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean | null
          is_in_person?: boolean | null
          is_online?: boolean | null
          name?: string
          price?: number
          professional_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professional_services_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_settings: {
        Row: {
          accept_bank_transfer: boolean | null
          accept_card: boolean | null
          accept_cash: boolean | null
          accept_paypal: boolean | null
          accept_satispay: boolean | null
          allow_direct_contact: boolean | null
          bank_account_holder: string | null
          bank_iban: string | null
          cancellation_min_hours: number | null
          cancellation_penalty_percent: number | null
          cancellation_policy_enabled: boolean | null
          coverage_address: string | null
          coverage_city: string | null
          coverage_country: string | null
          coverage_latitude: number | null
          coverage_longitude: number | null
          coverage_postal_code: string | null
          coverage_radius_km: number | null
          created_at: string | null
          facebook_url: string | null
          id: string
          instagram_url: string | null
          linkedin_url: string | null
          next_payout_date: string | null
          no_show_penalty_percent: number | null
          notification_sound_enabled: boolean | null
          notification_vibration_enabled: boolean | null
          notify_booking_cancelled: boolean | null
          notify_booking_reminder: boolean | null
          notify_messages: boolean | null
          notify_new_booking: boolean | null
          notify_push: boolean | null
          notify_reviews: boolean | null
          notify_weekly_summary: boolean | null
          payment_method_brand: string | null
          payment_method_exp_month: number | null
          payment_method_exp_year: number | null
          payment_method_id: string | null
          payment_method_last4: string | null
          payment_provider: string | null
          paypal_email: string | null
          paypal_subscription_email: string | null
          paypal_subscription_id: string | null
          professional_id: string
          profile_public: boolean | null
          reminder_hours_before: number[] | null
          satispay_phone: string | null
          show_price: boolean | null
          show_reviews: boolean | null
          stripe_account_id: string | null
          stripe_connect_enabled: boolean | null
          stripe_customer_id: string | null
          stripe_payout_enabled: boolean | null
          subscription_current_period_end: string | null
          subscription_plan: string | null
          subscription_status: string | null
          subscription_trial_ends_at: string | null
          tiktok_url: string | null
          updated_at: string | null
          website_url: string | null
          youtube_url: string | null
        }
        Insert: {
          accept_bank_transfer?: boolean | null
          accept_card?: boolean | null
          accept_cash?: boolean | null
          accept_paypal?: boolean | null
          accept_satispay?: boolean | null
          allow_direct_contact?: boolean | null
          bank_account_holder?: string | null
          bank_iban?: string | null
          cancellation_min_hours?: number | null
          cancellation_penalty_percent?: number | null
          cancellation_policy_enabled?: boolean | null
          coverage_address?: string | null
          coverage_city?: string | null
          coverage_country?: string | null
          coverage_latitude?: number | null
          coverage_longitude?: number | null
          coverage_postal_code?: string | null
          coverage_radius_km?: number | null
          created_at?: string | null
          facebook_url?: string | null
          id?: string
          instagram_url?: string | null
          linkedin_url?: string | null
          next_payout_date?: string | null
          no_show_penalty_percent?: number | null
          notification_sound_enabled?: boolean | null
          notification_vibration_enabled?: boolean | null
          notify_booking_cancelled?: boolean | null
          notify_booking_reminder?: boolean | null
          notify_messages?: boolean | null
          notify_new_booking?: boolean | null
          notify_push?: boolean | null
          notify_reviews?: boolean | null
          notify_weekly_summary?: boolean | null
          payment_method_brand?: string | null
          payment_method_exp_month?: number | null
          payment_method_exp_year?: number | null
          payment_method_id?: string | null
          payment_method_last4?: string | null
          payment_provider?: string | null
          paypal_email?: string | null
          paypal_subscription_email?: string | null
          paypal_subscription_id?: string | null
          professional_id: string
          profile_public?: boolean | null
          reminder_hours_before?: number[] | null
          satispay_phone?: string | null
          show_price?: boolean | null
          show_reviews?: boolean | null
          stripe_account_id?: string | null
          stripe_connect_enabled?: boolean | null
          stripe_customer_id?: string | null
          stripe_payout_enabled?: boolean | null
          subscription_current_period_end?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          subscription_trial_ends_at?: string | null
          tiktok_url?: string | null
          updated_at?: string | null
          website_url?: string | null
          youtube_url?: string | null
        }
        Update: {
          accept_bank_transfer?: boolean | null
          accept_card?: boolean | null
          accept_cash?: boolean | null
          accept_paypal?: boolean | null
          accept_satispay?: boolean | null
          allow_direct_contact?: boolean | null
          bank_account_holder?: string | null
          bank_iban?: string | null
          cancellation_min_hours?: number | null
          cancellation_penalty_percent?: number | null
          cancellation_policy_enabled?: boolean | null
          coverage_address?: string | null
          coverage_city?: string | null
          coverage_country?: string | null
          coverage_latitude?: number | null
          coverage_longitude?: number | null
          coverage_postal_code?: string | null
          coverage_radius_km?: number | null
          created_at?: string | null
          facebook_url?: string | null
          id?: string
          instagram_url?: string | null
          linkedin_url?: string | null
          next_payout_date?: string | null
          no_show_penalty_percent?: number | null
          notification_sound_enabled?: boolean | null
          notification_vibration_enabled?: boolean | null
          notify_booking_cancelled?: boolean | null
          notify_booking_reminder?: boolean | null
          notify_messages?: boolean | null
          notify_new_booking?: boolean | null
          notify_push?: boolean | null
          notify_reviews?: boolean | null
          notify_weekly_summary?: boolean | null
          payment_method_brand?: string | null
          payment_method_exp_month?: number | null
          payment_method_exp_year?: number | null
          payment_method_id?: string | null
          payment_method_last4?: string | null
          payment_provider?: string | null
          paypal_email?: string | null
          paypal_subscription_email?: string | null
          paypal_subscription_id?: string | null
          professional_id?: string
          profile_public?: boolean | null
          reminder_hours_before?: number[] | null
          satispay_phone?: string | null
          show_price?: boolean | null
          show_reviews?: boolean | null
          stripe_account_id?: string | null
          stripe_connect_enabled?: boolean | null
          stripe_customer_id?: string | null
          stripe_payout_enabled?: boolean | null
          subscription_current_period_end?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          subscription_trial_ends_at?: string | null
          tiktok_url?: string | null
          updated_at?: string | null
          website_url?: string | null
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professional_settings_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: true
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          cancellation_reason: string | null
          card_brand: string | null
          card_exp_month: number | null
          card_exp_year: number | null
          card_last4: string | null
          created_at: string | null
          currency: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          payment_method_id: string | null
          payment_provider: string | null
          paypal_plan_id: string | null
          paypal_subscription_id: string | null
          plan: string
          price_cents: number
          professional_id: string
          status: string
          stripe_customer_id: string | null
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          trial_end: string | null
          trial_start: string | null
          updated_at: string | null
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          cancellation_reason?: string | null
          card_brand?: string | null
          card_exp_month?: number | null
          card_exp_year?: number | null
          card_last4?: string | null
          created_at?: string | null
          currency?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          payment_method_id?: string | null
          payment_provider?: string | null
          paypal_plan_id?: string | null
          paypal_subscription_id?: string | null
          plan?: string
          price_cents?: number
          professional_id: string
          status?: string
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string | null
        }
        Update: {
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          cancellation_reason?: string | null
          card_brand?: string | null
          card_exp_month?: number | null
          card_exp_year?: number | null
          card_last4?: string | null
          created_at?: string | null
          currency?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          payment_method_id?: string | null
          payment_provider?: string | null
          paypal_plan_id?: string | null
          paypal_subscription_id?: string | null
          plan?: string
          price_cents?: number
          professional_id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professional_subscriptions_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: true
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      professionals: {
        Row: {
          approval_status: string | null
          approved_at: string | null
          attivo: boolean | null
          bio: string | null
          birth_date: string
          birth_place: string
          category: Database["public"]["Enums"]["professional_category"]
          company_name: string
          created_at: string
          email: string
          first_name: string
          foto_url: string | null
          id: string
          is_partner: boolean | null
          last_name: string
          modalita: string | null
          office_phone: string | null
          payment_method: string | null
          pec_email: string | null
          phone: string
          prezzo_fascia: string | null
          prezzo_seduta: number | null
          rating: number | null
          reviews_count: number | null
          sdi_code: string | null
          specializzazioni: string[] | null
          titolo_studio: string | null
          updated_at: string
          user_id: string | null
          vat_address: string
          vat_city: string
          vat_number: string
          vat_postal_code: string
          zona: string | null
        }
        Insert: {
          approval_status?: string | null
          approved_at?: string | null
          attivo?: boolean | null
          bio?: string | null
          birth_date: string
          birth_place: string
          category: Database["public"]["Enums"]["professional_category"]
          company_name: string
          created_at?: string
          email: string
          first_name: string
          foto_url?: string | null
          id?: string
          is_partner?: boolean | null
          last_name: string
          modalita?: string | null
          office_phone?: string | null
          payment_method?: string | null
          pec_email?: string | null
          phone: string
          prezzo_fascia?: string | null
          prezzo_seduta?: number | null
          rating?: number | null
          reviews_count?: number | null
          sdi_code?: string | null
          specializzazioni?: string[] | null
          titolo_studio?: string | null
          updated_at?: string
          user_id?: string | null
          vat_address: string
          vat_city: string
          vat_number: string
          vat_postal_code: string
          zona?: string | null
        }
        Update: {
          approval_status?: string | null
          approved_at?: string | null
          attivo?: boolean | null
          bio?: string | null
          birth_date?: string
          birth_place?: string
          category?: Database["public"]["Enums"]["professional_category"]
          company_name?: string
          created_at?: string
          email?: string
          first_name?: string
          foto_url?: string | null
          id?: string
          is_partner?: boolean | null
          last_name?: string
          modalita?: string | null
          office_phone?: string | null
          payment_method?: string | null
          pec_email?: string | null
          phone?: string
          prezzo_fascia?: string | null
          prezzo_seduta?: number | null
          rating?: number | null
          reviews_count?: number | null
          sdi_code?: string | null
          specializzazioni?: string[] | null
          titolo_studio?: string | null
          updated_at?: string
          user_id?: string | null
          vat_address?: string
          vat_city?: string
          vat_number?: string
          vat_postal_code?: string
          zona?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          birth_date: string | null
          birth_place: string | null
          created_at: string
          email: string | null
          feedback_15d_sent: boolean | null
          first_name: string | null
          full_name: string | null
          id: string
          last_login: string | null
          last_name: string | null
          phone: string | null
          role: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          birth_date?: string | null
          birth_place?: string | null
          created_at?: string
          email?: string | null
          feedback_15d_sent?: boolean | null
          first_name?: string | null
          full_name?: string | null
          id: string
          last_login?: string | null
          last_name?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          birth_date?: string | null
          birth_place?: string | null
          created_at?: string
          email?: string | null
          feedback_15d_sent?: boolean | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          last_login?: string | null
          last_name?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          client_id: string
          created_at: string | null
          end_date: string | null
          id: string
          name: string
          notes: string | null
          objective: string | null
          professional_id: string
          start_date: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          end_date?: string | null
          id?: string
          name: string
          notes?: string | null
          objective?: string | null
          professional_id: string
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          end_date?: string | null
          id?: string
          name?: string
          notes?: string | null
          objective?: string | null
          professional_id?: string
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string | null
          endpoint: string
          id: string
          is_active: boolean | null
          last_used_at: string | null
          p256dh: string
          professional_id: string
          updated_at: string | null
          user_agent: string | null
        }
        Insert: {
          auth: string
          created_at?: string | null
          endpoint: string
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          p256dh: string
          professional_id: string
          updated_at?: string | null
          user_agent?: string | null
        }
        Update: {
          auth?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          p256dh?: string
          professional_id?: string
          updated_at?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          booking_id: string | null
          comment: string | null
          created_at: string | null
          id: string
          is_verified: boolean | null
          is_visible: boolean | null
          professional_id: string
          rating: number
          response: string | null
          response_at: string | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          is_visible?: boolean | null
          professional_id: string
          rating: number
          response?: string | null
          response_at?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          is_visible?: boolean | null
          professional_id?: string
          rating?: number
          response?: string | null
          response_at?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          error_message: string | null
          id: string
          message: string
          professional_id: string
          scheduled_for: string
          sent_at: string | null
          status: string | null
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          error_message?: string | null
          id?: string
          message: string
          professional_id: string
          scheduled_for: string
          sent_at?: string | null
          status?: string | null
          title: string
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          error_message?: string | null
          id?: string
          message?: string
          professional_id?: string
          scheduled_for?: string
          sent_at?: string | null
          status?: string | null
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_notifications_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_invoices: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          invoice_date: string
          invoice_number: string | null
          invoice_pdf_url: string | null
          paid_at: string | null
          paypal_invoice_id: string | null
          professional_id: string
          status: string | null
          stripe_invoice_id: string | null
          subscription_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          invoice_date: string
          invoice_number?: string | null
          invoice_pdf_url?: string | null
          paid_at?: string | null
          paypal_invoice_id?: string | null
          professional_id: string
          status?: string | null
          stripe_invoice_id?: string | null
          subscription_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          invoice_date?: string
          invoice_number?: string | null
          invoice_pdf_url?: string | null
          paid_at?: string | null
          paypal_invoice_id?: string | null
          professional_id?: string
          status?: string | null
          stripe_invoice_id?: string | null
          subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_invoices_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "professional_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_objectives: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          description: string
          id: string
          progress: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          description: string
          id?: string
          progress?: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          description?: string
          id?: string
          progress?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_onboarding_responses: {
        Row: {
          allergie_alimentari: string[] | null
          altezza: number | null
          altri_attrezzi: string | null
          attrezzi: string[] | null
          condizioni_mediche: string | null
          consigli_nutrizionali: boolean | null
          created_at: string | null
          eta: number | null
          giorni_settimana: number | null
          ha_limitazioni: boolean | null
          last_modified_at: string | null
          limitazioni_compilato_at: string | null
          limitazioni_fisiche: string | null
          livello_esperienza: string | null
          luoghi_allenamento: Json | null
          nome: string | null
          obiettivo: string | null
          onboarding_completed_at: string | null
          peso: number | null
          possiede_attrezzatura: boolean | null
          tempo_sessione: number | null
          user_id: string
          zone_dolori_dettagli: Json | null
          zone_evitare: string[] | null
        }
        Insert: {
          allergie_alimentari?: string[] | null
          altezza?: number | null
          altri_attrezzi?: string | null
          attrezzi?: string[] | null
          condizioni_mediche?: string | null
          consigli_nutrizionali?: boolean | null
          created_at?: string | null
          eta?: number | null
          giorni_settimana?: number | null
          ha_limitazioni?: boolean | null
          last_modified_at?: string | null
          limitazioni_compilato_at?: string | null
          limitazioni_fisiche?: string | null
          livello_esperienza?: string | null
          luoghi_allenamento?: Json | null
          nome?: string | null
          obiettivo?: string | null
          onboarding_completed_at?: string | null
          peso?: number | null
          possiede_attrezzatura?: boolean | null
          tempo_sessione?: number | null
          user_id: string
          zone_dolori_dettagli?: Json | null
          zone_evitare?: string[] | null
        }
        Update: {
          allergie_alimentari?: string[] | null
          altezza?: number | null
          altri_attrezzi?: string | null
          attrezzi?: string[] | null
          condizioni_mediche?: string | null
          consigli_nutrizionali?: boolean | null
          created_at?: string | null
          eta?: number | null
          giorni_settimana?: number | null
          ha_limitazioni?: boolean | null
          last_modified_at?: string | null
          limitazioni_compilato_at?: string | null
          limitazioni_fisiche?: string | null
          livello_esperienza?: string | null
          luoghi_allenamento?: Json | null
          nome?: string | null
          obiettivo?: string | null
          onboarding_completed_at?: string | null
          peso?: number | null
          possiede_attrezzatura?: boolean | null
          tempo_sessione?: number | null
          user_id?: string
          zone_dolori_dettagli?: Json | null
          zone_evitare?: string[] | null
        }
        Relationships: []
      }
      user_workout_stats: {
        Row: {
          created_at: string
          current_streak_days: number | null
          id: string
          last_workout_date: string | null
          longest_streak_days: number | null
          total_hours: number | null
          total_workouts: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak_days?: number | null
          id?: string
          last_workout_date?: string | null
          longest_streak_days?: number | null
          total_hours?: number | null
          total_workouts?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak_days?: number | null
          id?: string
          last_workout_date?: string | null
          longest_streak_days?: number | null
          total_hours?: number | null
          total_workouts?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      workout_diary: {
        Row: {
          completed_at: string | null
          created_at: string
          duration_minutes: number | null
          exercises: Json | null
          exercises_count: number | null
          id: string
          notes: string | null
          photo_urls: string[] | null
          saved_at: string
          status: string
          updated_at: string
          user_id: string
          workout_id: string | null
          workout_name: string
          workout_source: string
          workout_type: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          duration_minutes?: number | null
          exercises?: Json | null
          exercises_count?: number | null
          id?: string
          notes?: string | null
          photo_urls?: string[] | null
          saved_at?: string
          status?: string
          updated_at?: string
          user_id: string
          workout_id?: string | null
          workout_name: string
          workout_source: string
          workout_type?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          duration_minutes?: number | null
          exercises?: Json | null
          exercises_count?: number | null
          id?: string
          notes?: string | null
          photo_urls?: string[] | null
          saved_at?: string
          status?: string
          updated_at?: string
          user_id?: string
          workout_id?: string | null
          workout_name?: string
          workout_source?: string
          workout_type?: string | null
        }
        Relationships: []
      }
      workout_plans: {
        Row: {
          created_at: string
          description: string | null
          durata: number
          esercizi: Json
          id: string
          is_active: boolean
          luogo: string
          metadata: Json | null
          nome: string
          obiettivo: string
          saved_for_later: boolean
          source: string | null
          status: string | null
          tipo: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          durata?: number
          esercizi?: Json
          id?: string
          is_active?: boolean
          luogo: string
          metadata?: Json | null
          nome: string
          obiettivo: string
          saved_for_later?: boolean
          source?: string | null
          status?: string | null
          tipo?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          durata?: number
          esercizi?: Json
          id?: string
          is_active?: boolean
          luogo?: string
          metadata?: Json | null
          nome?: string
          obiettivo?: string
          saved_for_later?: boolean
          source?: string | null
          status?: string | null
          tipo?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auto_complete_past_bookings: {
        Args: { p_professional_id?: string }
        Returns: number
      }
      check_user_has_app: { Args: { user_email: string }; Returns: boolean }
      get_blocked_dates_in_range: {
        Args: { p_end: string; p_professional_id: string; p_start: string }
        Returns: {
          blocked_date: string
        }[]
      }
      get_portal_professional_stats: {
        Args: { prof_id: string }
        Returns: {
          avg_rating: number
          completion_rate: number
          total_bookings: number
          total_reviews: number
        }[]
      }
      get_user_primebot_stats: { Args: { user_uuid: string }; Returns: Json }
      increment_message_count: {
        Args: { user_uuid: string }
        Returns: undefined
      }
      is_date_blocked: {
        Args: { p_date: string; p_professional_id: string }
        Returns: boolean
      }
      migrate_existing_onboarding_data: { Args: never; Returns: undefined }
      rollback_metadata_cleanup: { Args: never; Returns: undefined }
      validate_password_strength: {
        Args: { password_text: string }
        Returns: boolean
      }
    }
    Enums: {
      professional_category:
        | "fisioterapista"
        | "nutrizionista"
        | "mental_coach"
        | "osteopata"
        | "pt"
      user_category: "amatori" | "atleti" | "agonisti"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      professional_category: [
        "fisioterapista",
        "nutrizionista",
        "mental_coach",
        "osteopata",
        "pt",
      ],
      user_category: ["amatori", "atleti", "agonisti"],
    },
  },
} as const
