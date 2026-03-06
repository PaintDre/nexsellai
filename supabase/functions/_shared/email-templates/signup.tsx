/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Hr,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>Confirma tu correo para empezar a vender con {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Img
            src="https://fizryssrfsojiavxmhrt.supabase.co/storage/v1/object/public/email-assets/logo-ns.png"
            width="48"
            height="48"
            alt="Nexsell"
            style={logo}
          />
        </Section>
        <Heading style={h1}>¡Bienvenido a Nexsell! 🚀</Heading>
        <Text style={text}>
          Estás a un paso de crear landings que venden. Confirma tu correo electrónico (
          <Link href={`mailto:${recipient}`} style={link}>
            {recipient}
          </Link>
          ) para activar tu cuenta.
        </Text>
        <Section style={buttonSection}>
          <Button style={button} href={confirmationUrl}>
            Confirmar mi correo
          </Button>
        </Section>
        <Text style={subtleText}>
          Si el botón no funciona, copia y pega este enlace en tu navegador:
        </Text>
        <Text style={urlText}>
          <Link href={confirmationUrl} style={link}>{confirmationUrl}</Link>
        </Text>
        <Hr style={hr} />
        <Text style={footer}>
          Si no creaste una cuenta en{' '}
          <Link href={siteUrl} style={link}>{siteName}</Link>
          , puedes ignorar este correo con total tranquilidad.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }
const container = { padding: '40px 30px', maxWidth: '520px', margin: '0 auto' }
const logoSection = { textAlign: 'center' as const, marginBottom: '24px' }
const logo = { borderRadius: '12px' }
const h1 = {
  fontSize: '24px',
  fontWeight: 'bold' as const,
  color: '#1a2332',
  margin: '0 0 16px',
  textAlign: 'center' as const,
}
const text = { fontSize: '15px', color: '#64748b', lineHeight: '1.6', margin: '0 0 24px' }
const link = { color: '#249b5e', textDecoration: 'underline' }
const buttonSection = { textAlign: 'center' as const, margin: '0 0 24px' }
const button = {
  backgroundColor: '#249b5e',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 'bold' as const,
  borderRadius: '12px',
  padding: '14px 32px',
  textDecoration: 'none',
}
const subtleText = { fontSize: '12px', color: '#94a3b8', lineHeight: '1.5', margin: '0 0 4px' }
const urlText = { fontSize: '12px', color: '#94a3b8', lineHeight: '1.5', margin: '0 0 24px', wordBreak: 'break-all' as const }
const hr = { borderColor: '#e2e8f0', margin: '0 0 20px' }
const footer = { fontSize: '12px', color: '#94a3b8', margin: '0', textAlign: 'center' as const }
