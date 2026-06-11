import { Alert } from 'react-native'
import { Classification } from '../../screens/ClassificationScreen'
import { prepareSj311Submission } from '../../api/serverApi'
import { buildSj311AutofillScript } from './autofillScript'
import { buildSj311FormPayload } from './buildPayload'
import { SJ311_PORTAL_BASE_URL } from './serviceCatalog'
import { Sj311Reporter, Sj311SubmitOutcome } from './types'

export type Sj311SubmitSession = {
  portalUrl: string
  autofillScript: string
  payload: ReturnType<typeof buildSj311FormPayload>
  instructions: string[]
}

export const createSj311SubmitSession = async (
  classification: Classification,
  reporter: Sj311Reporter = {},
): Promise<Sj311SubmitSession> => {
  const payload = buildSj311FormPayload(classification, reporter)
  const autofillScript = buildSj311AutofillScript(payload)

  const serverPrepared = await prepareSj311Submission({
    classification,
    reporter,
  })

  if (serverPrepared?.ok) {
    return {
      portalUrl: serverPrepared.portalUrl,
      autofillScript: serverPrepared.autofillScript || autofillScript,
      payload: serverPrepared.payload,
      instructions: serverPrepared.instructions,
    }
  }

  return {
    portalUrl: payload.entryUrl || SJ311_PORTAL_BASE_URL,
    autofillScript,
    payload,
    instructions: [
      'CityFix will open the official San José 311 portal.',
      'Review the pre-filled fields, add a photo manually, then submit on the 311 site.',
      payload.photoNote,
    ],
  }
}

export const confirmSj311Submission = () =>
  new Promise<boolean>((resolve) => {
    Alert.alert(
      'Confirm 311 submission',
      'Submit the report on the San José 311 page, then confirm here so CityFix can save your report.',
      [
        { text: 'Not yet', style: 'cancel', onPress: () => resolve(false) },
        { text: 'I submitted it', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    )
  })

export const submitSanJose311Report = async (
  classification: Classification,
  reporter: Sj311Reporter = {},
): Promise<{ outcome: Sj311SubmitOutcome; session: Sj311SubmitSession }> => {
  const session = await createSj311SubmitSession(classification, reporter)
  return {
    outcome: 'portal_opened',
    session,
  }
}
