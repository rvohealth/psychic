export const MMS_CARRIERS = {
  att: 'mms.att.net',
  boost_mobile: 'myboostmobile.com',
  c_spire: 'cspire1.com',
  consumer_cellular: 'mailmymobile.net',
  cricket: 'mms.cricketwireless.net',
  google_fi: 'msg.fi.google.com',
  metro_pcs: 'mymetropcs.com',
  mint_mobile: 'mailmymobile.net',
  page_plus: 'mypixmessages.com',
  red_pocket: {
    cdma: 'vmpix.com',
    gsm: 'mms.att.net',
  },
  republic_wireless: null,
  simple_mobile: null,
  sprint: 'pm.sprint.com',
  tmobile: 'tmomail.net',
  ting: null,
  tracfone: 'mmst5.tracfone.com',
  us_cellular: 'mms.uscc.net',
  verizon: 'vzwpix.com',
  virgin_mobile: 'vmpix.com',
  xfinity_mobile: 'mypixmessages.com',
}

export const SMS_CARRIERS = {
  att: 'txt.att.net',
  boost_mobile: 'sms.myboostmobile.com',
  c_spire: 'cspire1.com',
  consumer_cellular: 'mailmymobile.net',
  cricket: 'sms.cricketwireless.net',
  google_fi: 'msg.fi.google.com',
  metro_pcs: 'mymetropcs.com',
  mint_mobile: 'mailmymobile.net',
  page_plus: 'vtext.com',
  red_pocket: {
    cdma: 'vtext.com',
    gsm: 'txt.att.net',
  },
  republic_wireless: 'text.republicwireless.com',
  simple_mobile: 'smtext.com',
  sprint: 'messaging.sprintpcs.com',
  tmobile: 'tmomail.net',
  ting: {
    cdma: 'message.ting.com',
    gsm: 'tmomail.net',
  },
  tracfone: null,
  us_cellular: 'email.uscc.net',
  verizon: 'vtext.com',
  virgin_mobile: 'vmobl.com',
  xfinity_mobile: 'vtext.com',
}

export function smsAddress(phoneNumber, carrierName, chipType) {
}

export function mmsForCarrier(carrierName, chipType='gsm') {
  switch(carrierName.toLowerCase().replace(/-/g, '_')) {
  case 'att':
  case 'at&t':
    return MMS_CARRIERS.att

  case 'boost':
  case 'boost_mobile':
    return MMS_CARRIERS.boost_mobile

  case 'cspire':
  case 'c_spire':
    return MMS_CARRIERS.c_spire

  case 'consumer':
  case 'consumer_cellular':
    return MMS_CARRIERS.consumer_cellular

  case 'cricket':
  case 'cricket_wireless':
    return MMS_CARRIERS.cricket

  case 'googlefi':
  case 'google_fi':
    return MMS_CARRIERS.google_fi

  case 'metropcs':
  case 'metro_pcs':
    return MMS_CARRIERS.metro_pcs

  case 'mintmobile':
  case 'mint_mobile':
    return MMS_CARRIERS.mint_mobile

  case 'pageplus':
  case 'page_plus':
    return MMS_CARRIERS.page_plus

  case 'redrocket':
  case 'red_rocket':
    return MMS_CARRIERS.red_rocket[chipType]

  case 'republic':
  case 'republic_wireless':
    return MMS_CARRIERS.republic_wireless

  case 'simple':
  case 'simple_mobile':
    return MMS_CARRIERS.simple_mobile

  case 'sprint':
  case 'sprint_wireless':
    return MMS_CARRIERS.sprint

  case 'tmobile':
  case 't_mobile':
    return MMS_CARRIERS.tmobile

  case 'ting':
  case 'ting_wireless':
    return MMS_CARRIERS.ting

  case 'tracfone':
    return MMS_CARRIERS.tracfone

  case 'us_cellular':
    return MMS_CARRIERS.us_cellular

  case 'verizon':
  case 'verizon_wireless':
    return MMS_CARRIERS.verizon

  case 'virgin_mobile':
  case 'virgin':
    return MMS_CARRIERS.virgin_mobile

  case 'xfinity':
  case 'xfinity_mobile':
    return MMS_CARRIERS.xfinity_mobile

  default:
    throw `unrecognized carrier ${carrierName}`
  }
}

export function smsForCarrier(carrierName, chipType='gsm') {
  switch(carrierName.toLowerCase().replace(/-/g, '_')) {
  case 'att':
  case 'at&t':
    return SMS_CARRIERS.att

  case 'boost':
  case 'boost_mobile':
    return SMS_CARRIERS.boost_mobile

  case 'cspire':
  case 'c_spire':
    return SMS_CARRIERS.c_spire

  case 'consumer':
  case 'consumer_cellular':
    return SMS_CARRIERS.consumer_cellular

  case 'cricket':
  case 'cricket_wireless':
    return SMS_CARRIERS.cricket

  case 'googlefi':
  case 'google_fi':
    return SMS_CARRIERS.google_fi

  case 'metropcs':
  case 'metro_pcs':
    return SMS_CARRIERS.metro_pcs

  case 'mintmobile':
  case 'mint_mobile':
    return SMS_CARRIERS.mint_mobile

  case 'pageplus':
  case 'page_plus':
    return SMS_CARRIERS.page_plus

  case 'redrocket':
  case 'red_rocket':
    return SMS_CARRIERS.red_rocket[chipType]

  case 'republic':
  case 'republic_wireless':
    return SMS_CARRIERS.republic_wireless

  case 'simple':
  case 'simple_mobile':
    return SMS_CARRIERS.simple_mobile

  case 'sprint':
  case 'sprint_wireless':
    return SMS_CARRIERS.sprint

  case 'tmobile':
  case 't_mobile':
    return SMS_CARRIERS.tmobile

  case 'ting':
  case 'ting_wireless':
    return SMS_CARRIERS.ting[chipType]

  case 'tracfone':
    return SMS_CARRIERS.tracfone

  case 'us_cellular':
    return SMS_CARRIERS.us_cellular

  case 'verizon':
  case 'verizon_wireless':
    return SMS_CARRIERS.verizon

  case 'virgin_mobile':
  case 'virgin':
    return SMS_CARRIERS.virgin_mobile

  case 'xfinity':
  case 'xfinity_mobile':
    return SMS_CARRIERS.xfinity_mobile

  default:
    throw `unrecognized carrier ${carrierName}`
  }
}

