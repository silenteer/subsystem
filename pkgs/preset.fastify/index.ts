import { z } from "zod"
import fastify from "fastify"
import { CallContext, define, inferDefine } from "@subsystem/server"

const configSchema = z.object({
  port: z.number().default(3000)
})

export const config = define.config(() => {
  return configSchema.parse({
    port: process.env.FASTIFY_PORT
  })
})

export type subsystemFastifyConfig = inferDefine<typeof config>

export const adaptor = define.adaptor(async (subsystem, router) => {
  const config = configSchema.parse(subsystem.config)
  const server = fastify({ logger: true })

  server.get('/*', async (req, rep) => {
    const url = req.url.substring(1)
    req.log.info({ url })

    if (router.has(url)) {
      const data: CallContext['input'] = {
        headers: req.headers as any,
        body: Object.assign({}, req.params, req.query, req.body)
      }

      const result = await router.call(url, data, { id: req.id, req, rep })

      return rep
        .headers(result.output.headers)
        .send(result.output.body)
    } else {
      return rep.code(404)
        .send()
    }
  })

  server.listen({
    port: config.port
  })
})