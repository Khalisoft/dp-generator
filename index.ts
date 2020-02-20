import html2canvas from 'html2canvas'
import Canvas2Image from 'canvas2image'

import { GeneratorOptions } from './lib'

function isType (value: Object, type: string) {
  return {}.toString.call(value) === `[object ${type}]`
}

export default function dpGenerator (options: GeneratorOptions) {
  if (!isType(options, 'Object')) {
    throw new TypeError('Generator options must be an object.')
  }

  const container = document.getElementById(options.container)
  const form = document.getElementById(options.form)

  if (!container) {
    throw new ReferenceError('Container to print does not exist.')
  }

  if (!form) {
    throw new ReferenceError('Form container to get input from does not exist.')
  }

  if (form.nodeName !== 'FORM') {
    throw new TypeError('Form container provided is not a valid form element.')
  }

  options.models.map(function (model, index) {
    const input = document.getElementById(model.input)
    const output = document.getElementById(model.output)

    if (!input) {
      throw new ReferenceError(
        'Input source for model at index ' + index + ' does not exist.'
      )
    }

    if (!output) {
      throw new ReferenceError(
        'Output element for model at index ' + index + ' does not exist.'
      )
    }

    const changeHandler = function (event: Event) {
      const target = event.target as HTMLInputElement
      const isFile = target.type === 'file'
      let value = isFile ? target.files.length && target.files[0] : target.value
      const transformer = model.transformer
      const validator = model.validator
      const onError = model.onError
      const defaultValue = isType(model.defaultValue, 'String')
        ? model.defaultValue
        : ''

      const handleError = function handleError () {
        return isType(onError, 'Function') ? onError(event) : false
      }

      const setOutputValue = function setOutputValue (outValue: string | Blob | File) {
        if (isType(model.handler, 'Function')) {
          return model.handler(outValue as string)
        }

        if (!outValue) {
          if (isFile) {
            (output as HTMLImageElement).src = defaultValue
          } else {
            output.innerText = defaultValue
          }
          return
        }

        if (isFile) {
          const generalFileMime = (outValue as File).type.split('/')[0]

          if (generalFileMime !== 'image') {
            return handleError()
          }

          const reader = new window.FileReader()
          reader.onload = function () {
            (output as HTMLImageElement).src = reader.result.toString()
          }
          reader.onerror = function () {}
          reader.readAsDataURL(outValue as Blob)
          return
        }

        output.innerText = outValue as string
      }

      setOutputValue('')

      if (isType(validator, 'Function') && !validator(value)) {
        return handleError()
      }

      value = isType(transformer, 'Function') ? transformer(value) : value

      setOutputValue(value)
    }

    changeHandler({ target: output } as unknown as Event)

    input.addEventListener('input', changeHandler)
    input.addEventListener('change', changeHandler)
  })

  form.addEventListener('submit', function (ev) {
    ev.preventDefault()

    if (
      isType(options.submitValidator, 'Function') &&
      !options.submitValidator(ev)
    ) {
      return
    }

    const oldWidth = container.style.width
    const oldHeight = container.style.height
    const newWidth = options.width
    const newHeight = options.height

    container.style.width = newWidth + 'px'
    container.style.height = newHeight + 'px'

    html2canvas(container, {
      scale: 1,
      width: newWidth,
      height: newHeight
    }).then(function (canvas: HTMLCanvasElement) {
      const fileName = typeof options.fileName === 'function'
        ? options.fileName(ev)
        : 'generated-dp'

      Canvas2Image.saveAsPNG(canvas, null, null, fileName)
      container.style.width = oldWidth
      container.style.height = oldHeight
    })
  })
}
