export type FieldType = string | File

export type FieldOutput = FieldType | Blob

export interface FieldDef {
  input: string
  output: string
  defaultValue?: string
  transformer?: (v: FieldType) => FieldType
  validator?: (v: FieldType) => boolean
  onError?: (e: Event) => void
  handler?: (v: string) => void
}

export interface GeneratorOptions {
  models: FieldDef[]
  container: string
  form: string
  width: number
  height: number
  fileName?: string | ((e: Event) => string)
  submitValidator?: (e: Event) => boolean
}
