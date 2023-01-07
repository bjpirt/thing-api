import { ZodError } from 'zod'

const formatZodErrors = (error: ZodError): string[] =>
  error.issues.map((issue) => {
    if (issue.code === 'invalid_type') {
      if (issue.received === 'undefined') {
        return `Missing attribute: ${issue.path.join('.')}`
      }
      return `${issue.message}: ${issue.path.join('.')}`
    }
    return issue.message
  })

export default formatZodErrors
