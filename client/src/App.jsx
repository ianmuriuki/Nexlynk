import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from 'react-hot-toast'
import router from '@/router'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 3,
      retry: (count, error) => {
        if (error?.status === 401 || error?.status === 403) return false
        return count < 2
      },
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster
        position="bottom-center"
        toastOptions={{
          duration: 4000,
          style: {
            fontFamily: 'Manrope, system-ui, sans-serif',
            fontSize: '13px',
            fontWeight: 600,
            borderRadius: '9999px',
            background: '#16182B',
            color: '#fff',
            boxShadow: '0 18px 48px rgba(22,24,43,.16), 0 4px 12px rgba(22,24,43,.08)',
            border: 'none',
          },
          success: { iconTheme: { primary: '#10B981', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
        }}
      />
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  )
}