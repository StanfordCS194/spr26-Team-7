import * as QueryParams from 'expo-auth-session/build/QueryParams'
import { makeRedirectUri } from 'expo-auth-session'
import * as WebBrowser from 'expo-web-browser'
import Constants, { ExecutionEnvironment } from 'expo-constants'
import { Platform } from 'react-native'
import { supabase } from './supabase'

WebBrowser.maybeCompleteAuthSession()

type SignUpProfile = {
  fullName: string
  zipCode: string
}

export const getAuthRedirectUri = () => {
  const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient

  if (isExpoGo) {
    return makeRedirectUri({
      path: 'auth/callback',
      preferLocalhost: Platform.OS === 'ios',
    })
  }

  return makeRedirectUri({
    scheme: 'govchat',
    path: 'auth/callback',
  })
}

const resolveProviderSignInUrl = async (authorizeUrl: string) => {
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
  if (!anonKey) {
    return authorizeUrl
  }

  try {
    const response = await fetch(authorizeUrl, {
      method: 'GET',
      redirect: 'manual',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
    })

    const location = response.headers.get('location')
    if (location) {
      return location
    }
  } catch {
    // Fall back to the authorize URL if the follow-up request fails.
  }

  return authorizeUrl
}

const createSessionFromUrl = async (url: string) => {
  const { params, errorCode } = QueryParams.getQueryParams(url)

  if (errorCode) {
    throw new Error(errorCode)
  }

  const { access_token, refresh_token, code } = params

  if (access_token && refresh_token) {
    const { error } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    })
    if (error) {
      throw error
    }
    return
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      throw error
    }
    return
  }

  throw new Error('Sign-in redirect did not include an auth code or session tokens.')
}

export const handleAuthRedirectUrl = async (url: string) => {
  await createSessionFromUrl(url)
}

const dismissAuthBrowser = async () => {
  try {
    await WebBrowser.dismissBrowser()
  } catch {
    // No auth browser was presented.
  }
}

export const signInWithEmail = async (email: string, password: string) => {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    throw error
  }
}

export const signUpWithEmail = async (
  email: string,
  password: string,
  profile: SignUpProfile
) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: profile.fullName.trim(),
        zip_code: profile.zipCode.trim(),
      },
    },
  })

  if (error) {
    throw error
  }

  return data.session
}

export const signInWithGoogle = async () => {
  const redirectTo = getAuthRedirectUri()

  if (__DEV__) {
    console.log('[auth] Google redirect URL:', redirectTo)
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  })

  if (error) {
    throw error
  }

  if (!data.url) {
    throw new Error('Google sign-in did not return an authorization URL.')
  }

  const startUrl = await resolveProviderSignInUrl(data.url)

  if (__DEV__) {
    console.log('[auth] Google start URL:', startUrl)
  }

  try {
    const result = await WebBrowser.openAuthSessionAsync(startUrl, redirectTo)
    if (result.type !== 'success') {
      return
    }

    await handleAuthRedirectUrl(result.url)
  } finally {
    await dismissAuthBrowser()
  }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) {
    throw error
  }
}
