#!/usr/bin/env python3
from pathlib import Path
from hashlib import sha256
import sys

EXPECTED_SHA256 = '6199dd44646e4baf21c6dad2887b27e4cf954ac6beb1686563a61663ae28111f'
MODEL_FLASH = "      { value:'gemini-3.8-flash', label:'Gemini 3.8 Flash · 추천' },".encode()
MODEL_ARGON = "      { value:'gemini-4-argon', label:'Gemini 4 Argon · 고성능·고비용' },".encode()
THINK_FLASH = b"    if (/^gemini-3\\.8-flash(?:$|-)/.test(name)) return { thinkingLevel:['low','medium','high'].includes(level) ? level.toUpperCase() : 'MEDIUM', includeThoughts:false };"
THINK_SHARED = b"    if (name === 'gemini-4-argon' || /^gemini-3\\.8-flash(?:$|-)/.test(name)) return { thinkingLevel:['low','medium','high'].includes(level) ? level.toUpperCase() : 'MEDIUM', includeThoughts:false };"

def build(raw):
    assert sha256(raw).hexdigest() == EXPECTED_SHA256, 'original GitHub 0.17.30.1 checksum mismatch'
    assert raw.startswith(b'\xef\xbb\xbf'), 'BOM missing'
    assert raw.count(MODEL_FLASH) == 3 and raw.count(MODEL_ARGON) == 0, 'unexpected main model dropdown'
    assert raw.count(THINK_FLASH) == 1, 'unexpected original thinking branch'
    assert raw.count(b'0.17.30.1') == 5, 'unexpected old version markers'
    return raw.replace(MODEL_FLASH, MODEL_ARGON + b'\n' + MODEL_FLASH).replace(THINK_FLASH, THINK_SHARED).replace(b'0.17.30.1', b'0.17.30.2')

if __name__ == '__main__':
    original, output = map(Path, sys.argv[1:])
    assert original.resolve() != output.resolve(), 'source overwrite refused'
    result = build(original.read_bytes())
    output.write_bytes(result)
    print('SOURCE', EXPECTED_SHA256, 'OUTPUT', sha256(result).hexdigest(), 'SIZE', len(result))
