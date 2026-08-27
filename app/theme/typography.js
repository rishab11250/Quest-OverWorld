export const fonts = {
  pixel: 'PressStart2P-Regular',
  body: 'Nunito-Regular',
  bodySemiBold: 'Nunito-SemiBold',
  bodyBold: 'Nunito-Bold',
  mono: 'IBMPlexMono-Regular',
};

export const typography = {
  displayXl: {
    fontFamily: fonts.bodyBold,
    fontSize: 32,
    lineHeight: 40,
  },
  displayPixel: {
    fontFamily: fonts.pixel,
    fontSize: 14,
    lineHeight: 24,
  },
  headingLg: {
    fontFamily: fonts.bodyBold,
    fontSize: 22,
    lineHeight: 28,
  },
  headingMd: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 18,
    lineHeight: 24,
  },
  bodyLg: {
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 24,
  },
  bodyMd: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
  },
  caption: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 16,
  },
  monoSm: {
    fontFamily: fonts.mono,
    fontSize: 13,
    lineHeight: 18,
  },
};

export default typography;
