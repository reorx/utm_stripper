.PHONY: clean test

clean:
	rm -rf dist

pack:
	mkdir -p dist
	cp -r utm_sweeper dist
	cd dist && zip -r utm_sweeper.zip utm_sweeper

test:
	open test/SpecRunner.html
