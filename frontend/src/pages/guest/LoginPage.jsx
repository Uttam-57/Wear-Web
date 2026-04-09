import LoginForm from '@/features/auth/components/LoginForm'

// Thin page — assembles nothing except the organism
// AuthLayout (template) provides the shell: logo, toggle, scrolling images
// This file only tells the router what form to render inside the layout
const LoginPage = () => <LoginForm />

export default LoginPage