import { z } from 'zod'
// import KeyValuePair from './KeyValuePair'

const GET = z.literal('GET')
const POST = z.literal('POST')
const PUT = z.literal('PUT')
const DELETE = z.literal('DELETE')
const WILDCARD = z.literal('*')

const httpMethodsSchema = z.union([GET, POST, PUT, DELETE])
const allHttpMethodsSchema = z.union([GET, POST, PUT, DELETE, WILDCARD])

export type HttpMethods = z.infer<typeof httpMethodsSchema>
export type WildcardHttpMethod = z.infer<typeof WILDCARD>
export type AllHttpMethods = z.infer<typeof allHttpMethodsSchema>

// const validateActions = (actions: HttpMethod[] | AllHttpMethods[]): boolean => {
//   if (actions.length == 0) {
//     return false
//   }
//   if (actions.includes('*') && actions.length !== 1) {
//     return false
//   }
//   const uniqueActions = Object.keys(
//     actions.reduce((acc: KeyValuePair<string, boolean>, action: string) => {
//       acc[action] = true
//       return acc
//     }, {})
//   )
//   return true
// }

export const createDatasetTokenSchema = z.object({
  name: z.string(),
  methods: z.union([httpMethodsSchema.array(), WILDCARD.array().max(1).min(1)])
})

export type CreateDatasetToken = z.infer<typeof createDatasetTokenSchema>

export type DynamoDatasetToken = CreateDatasetToken & {
  createdAt: string
}

export type OutputDatasetToken = DynamoDatasetToken & {
  id: string
}
