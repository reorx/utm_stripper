describe('stripURL function', function() {
    var stripURL = sweeper.stripURL,
        pairs;

    describe('strip with no arguments', function () {
        pairs = [
            ['http://example.com', 'http://example.com'],

            // Fragment
            ['http://example.com#', 'http://example.com#'],
            ['http://example.com#aaa', 'http://example.com#aaa'],
            // ['http://example.com#aaa?b=2', 'http://example.com'],

            // Query
            ['http://example.com?', 'http://example.com'],
            ['http://example.com?a=1', 'http://example.com?a=1'],
            ['http://example.com?a=1&utm_xx=2', 'http://example.com?a=1'],
            ['http://example.com?utm_xx=2&a=1', 'http://example.com?a=1'],
            ['http://example.com?utm_xx=1&utm_oo=2', 'http://example.com'],

            // Query & Fragment
            ['http://example.com?#', 'http://example.com#'],
            ['http://example.com?a=1#bbb', 'http://example.com?a=1#bbb'],
            ['http://example.com?utm_xx=2&a=1#bbb', 'http://example.com?a=1#bbb'],
            ['http://example.com?utm_xx=1&utm_oo=2#bbb', 'http://example.com#bbb'],
            ['http://example.com?a=0&utm_xx=1&utm_oo=2#bbb?c=3', 'http://example.com?a=0#bbb?c=3'],
        ];

        pairs.forEach(function(i) {
            it('should strip ' + i[0] + ' to ' + i[1], function() {
                expect(stripURL(i[0])).toBe(i[1]);
            });
        });
    });


    describe('strip with strip_fragment = true', function() {
        pairs = [
            ['http://example.com#', 'http://example.com'],
            ['http://example.com#aaa', 'http://example.com'],
            ['http://example.com?#', 'http://example.com?'],
            ['http://example.com?a=1#bbb', 'http://example.com?a=1'],
            ['http://example.com?a=0#bbb?c=3', 'http://example.com?a=0'],
            ['http://example.com?utm_xx=2&a=1#bbb', 'http://example.com?utm_xx=2&a=1'],
        ];

        pairs.forEach(function(i) {
            it('should strip ' + i[0] + ' to ' + i[1], function() {
                expect(stripURL(i[0], undefined, true)).toBe(i[1]);
            });
        });
    });

    describe('strip with strip_query = true, strip_fragment = true', function() {
        pairs = [
            ['http://example.com?#', 'http://example.com'],
            ['http://example.com?a=1#bbb', 'http://example.com'],
            ['http://example.com?utm_xx=2&a=1#bbb', 'http://example.com'],
            ['http://example.com?utm_xx=1&utm_oo=2#bbb', 'http://example.com'],
            ['http://example.com?a=0&utm_xx=1&utm_oo=2#bbb?c=3', 'http://example.com'],
        ];

        pairs.forEach(function(i) {
            it('should strip ' + i[0] + ' to ' + i[1], function() {
                expect(stripURL(i[0], true, true)).toBe(i[1]);
            });
        });
    });
});
