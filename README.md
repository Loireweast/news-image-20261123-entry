# The Daily World — Monday 23 November 2026

A newspaper front page summing up the world's news of Monday 23 November
2026, built for the make.fun `news-image-20261123` contest.

**Lead story:** Nvidia reinstates Jensen Huang as chief executive 11 days
after he resigned; the shares jump 31% — their best day since 2003 — and
Wall Street roars back.

**Also on the page:** Ukraine says it sank the Russian corvette *Merkury*
off Libya · the EU unveils its 22nd sanctions package · the Dymer toll
rises to 11 · India pledges $1.62bn to rebuild Nepal · the US seeks the
extradition of "El Chapo Isidro" · Iran vows to defy the US naval blockade.
Plus a markets strip and a ticker (COP31 blame game, NATO AWACS to Poland,
Molly Meldrum dies at 83).

Every story was verified live against reporting dated 23 November 2026
(Reuters, Associated Press, CNN, European Commission).

## How it works

`main.ts` (Node 22, standard library only) copies `entry.png` to
`$MAKEFUN_OUTPUT_DIR` (default `/output`). The image was rendered from
`tools/scene.html` with the fresh-written CDP driver `tools/render.mjs`
(headless Chrome, deterministic output — two renders hash identically).

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## License

MIT — see `LICENSE`.
