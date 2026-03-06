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

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({
  siteName,
  siteUrl,
  confirmationUrl,
}: InviteEmailProps) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>Te han invitado a unirte a {siteName}</Preview>
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
        <Heading style={h1}>¡Te han invitado! 🎉</Heading>
        <Text style={text}>
          Alguien te ha invitado a unirte a{' '}
          <Link href={siteUrl} style={link}>
            <strong>{siteName}</strong>
          </Link>
          . Haz clic en el botón para aceptar la invitación y crear tu cuenta.
        </Text>
        <Section style={buttonSection}>
          <Button style={button} href={confirmationUrl}>
            Aceptar invitación
          </Button>
        </Section>
        <Hr style={hr} />
        <Text style={footer}>
          Si no esperabas esta invitación, puedes ignorar este correo.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail

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
const hr = { borderColor: '#e2e8f0', margin: '0 0 20px' }
const footer = { fontSize: '12px', color: '#94a3b8', margin: '0', textAlign: 'center' as const }
