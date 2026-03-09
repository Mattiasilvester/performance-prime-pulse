import { Link } from 'react-router-dom'
import RegistrationForm from '@/components/auth/RegistrationForm'

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0C] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-[440px] mx-auto">
        {/* Header — NO icona */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-[#F0EDE8]">
            Benvenuto su Performance Prime
          </h1>
          <p className="text-[#F0EDE8]/50 text-[15px] mt-2">
            Crea il tuo account per iniziare il percorso
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#16161A] border border-white/[0.07] rounded-[20px] p-8 mt-8">
          <RegistrationForm />
        </div>

        <p className="text-center text-[#F0EDE8]/50 text-[15px] mt-6">
          Hai già un account?{' '}
          <Link to="/auth/login" className="text-[#EEBA2B] font-semibold hover:underline">
            Accedi
          </Link>
        </p>
      </div>
    </div>
  )
}
