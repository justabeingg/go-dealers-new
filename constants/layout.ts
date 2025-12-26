import { Dimensions } from 'react-native'

const { width, height } = Dimensions.get('window')

export const SCREEN = {
  WIDTH: width,
  HEIGHT: height,
}

export const NAV = {
  HEIGHT: 76,
}

// 👇 THIS controls floating look
export const CARD = {
  SIDE_GAP: 12,
  TOP_GAP: 60,
}
