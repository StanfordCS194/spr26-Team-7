import * as MailComposer from 'expo-mail-composer'
import { Linking } from 'react-native'
import { Classification } from '../screens/ClassificationScreen'

export type ReportEmailOutcome = 'sent' | 'cancelled' | 'needs_confirmation'

const REPORT_MAIL_TO = process.env.EXPO_PUBLIC_REPORT_EMAIL_TO ?? 'sjgovernment@gmail.com'

const buildReportEmailBody = (c: Classification, reporterEmail?: string | null) => {
  const lines = [
    `Category: ${c.category}`,
    `Issue type: ${c.tag}`,
    '',
    'Description:',
    c.desc,
    '',
    'Location:',
    c.locationMain,
    c.locationSub,
  ]

  if (reporterEmail) {
    lines.push('', `Reporter: ${reporterEmail}`)
  }

  return lines.join('\n')
}

export const sendReportEmail = async (
  c: Classification,
  reporterEmail?: string | null,
): Promise<ReportEmailOutcome> => {
  const subject = `City issue report — ${c.tag}`
  const body = buildReportEmailBody(c, reporterEmail)

  if (await MailComposer.isAvailableAsync()) {
    const result = await MailComposer.composeAsync({
      recipients: [REPORT_MAIL_TO],
      subject,
      body,
    })

    if (result.status === MailComposer.MailComposerStatus.SENT) {
      return 'sent'
    }
    if (result.status === MailComposer.MailComposerStatus.CANCELLED) {
      return 'cancelled'
    }
    if (result.status === MailComposer.MailComposerStatus.SAVED) {
      return 'cancelled'
    }
    return 'needs_confirmation'
  }

  const url = `mailto:${REPORT_MAIL_TO}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`

  try {
    await Linking.openURL(url)
    return 'needs_confirmation'
  } catch {
    return 'cancelled'
  }
}
