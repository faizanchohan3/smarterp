import asyncio, ssl, os, sys, edge_tts
import edge_tts.communicate as c
c._SSL_CTX = ssl.create_default_context(cafile="/root/.ccr/ca-bundle.crt")
async def main(voice, text, out, rate="+0%"):
    await edge_tts.Communicate(text, voice, rate=rate, proxy=os.environ.get("HTTPS_PROXY")).save(out)
asyncio.run(main(*sys.argv[1:]))
