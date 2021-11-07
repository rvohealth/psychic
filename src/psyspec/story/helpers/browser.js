export const goto = async url => {
  await page.goto(`${baseUrl}/${url}`)
}

export const find = async text => {
  let button
  try {
    [button] = await page.$x(`//button[contains(text(), '${text}')]`)
  } catch {
    throw 'Failed to find button'
  }

  console.log(button)
  return button
}

export const click = async (selector, opts) => {
  try {
    await page.click(selector, opts)
  } catch {
    await clickByText(selector)
  }
}

export const fillIn = async (selector, text) => {
  try {
    await page.focus(selector)
  } catch {
    await page.focus(`input[name=${selector}]`)
  }

  await page.keyboard.type(text)
}

function escapeXpathString(str) {
  const splitedQuotes = str.replace(/'/g, `', "'", '`);
  return `concat('${splitedQuotes}', '')`;
}

async function clickByText(text, { elementType }={}) {
  const escapedText = escapeXpathString(text)
  const linkHandlers = await page.$x(`//${elementType || 'button'}[contains(text(), ${escapedText})]`)

  if (linkHandlers.length > 0) {
    await linkHandlers[0].click()
  } else {
    throw new Error(`Link not found: ${text}`)
  }
}

