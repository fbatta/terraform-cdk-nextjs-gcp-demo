import { signIn, signOut, useSession } from 'next-auth/react'
import { Button, Textarea }  from '@nextui-org/react'

export default function Home() {
  const { data: session, status } = useSession();
  console.log(session)

  const handleLogin = () => {
    status == 'authenticated' ? signOut() : signIn()
  }

  return (
    <main
      className={`flex min-h-screen flex-col items-center justify-between p-24`}
    >
      <h1 className='font-semibold'>Welcome {session?.user?.name}!</h1>
      <Textarea
        isReadOnly
        label="Access token"
        variant='bordered'
        labelPlacement='outside'
        className='max-w-xs'
        value={session?.idToken || 'Not logged in'}
      />
      <Button color='primary' onClick={handleLogin}>
        {status == 'authenticated' && 'Logout'}
        {status == 'unauthenticated' && 'Login'}
      </Button>
    </main>
  )
}
