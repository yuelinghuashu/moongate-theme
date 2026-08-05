/**
 * 测试辅助函数
 */

/**
 * 静默捕获 console 输出，执行函数后恢复
 * @param {Function} fn 要执行的函数
 * @returns {{ stdout: string[], stderr: string[] }}
 */
export function captureConsole(fn) {
  const originalLog = console.log
  const originalWarn = console.warn
  const originalError = console.error
  const stdout = []
  const stderr = []

  console.log = (...args) => stdout.push(args.join(" "))
  console.warn = (...args) => stderr.push(args.join(" "))
  console.error = (...args) => stderr.push(args.join(" "))

  try {
    fn()
  } finally {
    console.log = originalLog
    console.warn = originalWarn
    console.error = originalError
  }

  return { stdout, stderr }
}

/**
 * 断言函数抛出匹配指定模式的错误
 * @param {Function} fn 要执行的函数
 * @param {RegExp|string} pattern 错误消息匹配模式
 */
export function assertThrows(fn, pattern) {
  let threw = null
  try {
    fn()
  } catch (err) {
    threw = err
  }
  if (!threw) {
    throw new Error(`预期函数抛出错误，但没有抛出`)
  }
  if (pattern instanceof RegExp) {
    if (!pattern.test(threw.message)) {
      throw new Error(`错误消息 "${threw.message}" 不匹配模式 ${pattern}`)
    }
  } else if (typeof pattern === "string") {
    if (!threw.message.includes(pattern)) {
      throw new Error(`错误消息 "${threw.message}" 不包含 "${pattern}"`)
    }
  }
  return threw
}

/**
 * 断言函数不抛出错误（静默执行）
 * @param {Function} fn 要执行的函数
 */
export function assertNoThrow(fn) {
  try {
    fn()
  } catch (err) {
    throw new Error(`预期函数不抛出错误，但抛出了: ${err.message}`)
  }
}