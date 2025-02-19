import { LoginForm } from "@/components/shared/auth/login-form/login-form"

export default function Home() {
  return (
    <main className="flex min-h-full flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-2xl font-bold leading-9 tracking-tight">Trusted Travel Quick</h1>
      </div>
      <LoginForm />
    </main>
  )
}

