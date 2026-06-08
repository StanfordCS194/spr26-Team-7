import AsyncStorage from '@react-native-async-storage/async-storage'

const STORAGE_KEY = '@cityfix_user_settings_v1'

export type UserSettings = {
  locationEnabled: boolean
  homeDistrict: number
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  locationEnabled: true,
  homeDistrict: 3,
}

export const loadUserSettings = async (): Promise<UserSettings> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return DEFAULT_USER_SETTINGS
    }

    const parsed = JSON.parse(raw) as Partial<UserSettings>
    const homeDistrict =
      typeof parsed.homeDistrict === 'number' && parsed.homeDistrict >= 1 && parsed.homeDistrict <= 10
        ? parsed.homeDistrict
        : DEFAULT_USER_SETTINGS.homeDistrict

    return {
      locationEnabled:
        typeof parsed.locationEnabled === 'boolean'
          ? parsed.locationEnabled
          : DEFAULT_USER_SETTINGS.locationEnabled,
      homeDistrict,
    }
  } catch {
    return DEFAULT_USER_SETTINGS
  }
}

export const saveUserSettings = async (settings: UserSettings): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}
