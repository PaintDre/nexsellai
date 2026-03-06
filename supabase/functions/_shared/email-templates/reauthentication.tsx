/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
  Hr,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>Tu código de verificación</Preview>
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
        <Heading style={h1}>Código de verificación</Heading>
        <Text style={text}>Usa el siguiente código para confirmar tu identidad:</Text>
        <Section style={codeContainer}>
          <Text style={codeStyle}>{token}</Text>
        </Section>
        <Hr style={hr} />
        <Text style={footer}>
          Este código expirará en breve. Si no lo solicitaste, puedes ignorar este correo.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

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
const codeContainer = { textAlign: 'center' as const, margin: '0 0 24px' }
const codeStyle = {
  fontFamily: "'Courier New', Courier, monospace",
  fontSize: '32px',
  fontWeight: 'bold' as const,
  color: '#249b5e',
  letterSpacing: '4px',
  margin: '0',
}
const hr = { borderColor: '#e2e8f0', margin: '0 0 20px' }
const footer = { fontSize: '12px', color: '#94a3b8', margin: '0', textAlign: 'center' as const }
