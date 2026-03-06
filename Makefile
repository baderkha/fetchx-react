.PHONY: install dev mac macos build macos-release

install:
	npm install

dev:
	npm run dev:all

mac: install
	npm run dev:all

macos: mac

build: install
	npm run build

dist: build
	npm run dist

macos-release: dist
