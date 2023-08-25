;; see SIP-005
;; https://github.com/stacksgov/sips/blob/feat/sip-015/sips/sip-005/sip-005-blocks-and-transactions.md

(define-read-only (serialize-bool (value bool))
	(if value type-id-true type-id-false))

(define-read-only (serialize-uint (value uint))
	(concat type-id-uint (uint128-to-buff-be value)))

(define-read-only (serialize-string (value (string-ascii 256)))
	(concat
		type-id-ascii
		(concat
			(uint32-to-buff-be (len value))
			(string-ascii-to-buff value))))

(define-read-only (serialize-buff (value (buff 256)))
	(concat
		type-id-buff
		(concat
			(uint32-to-buff-be (len value))
			value)))

(define-read-only (string-ascii-to-buff (str (string-ascii 256)))
	(fold string-ascii-to-buff-iter str 0x))

(define-read-only (byte-to-uint (byte (buff 1)))
	(unwrap-panic (index-of byte-list byte)))

(define-read-only (uint-to-byte (n uint))
	(unwrap-panic (element-at byte-list (mod n u255))))

(define-read-only (uint128-to-buff-be (n uint))
	(concat (unwrap-panic (element-at byte-list (mod (/ n u1329227995784915872903807060280344576) u256)))
		(concat (unwrap-panic (element-at byte-list (mod (/ n u5192296858534827628530496329220096) u256)))
		(concat (unwrap-panic (element-at byte-list (mod (/ n u20282409603651670423947251286016) u256)))
		(concat (unwrap-panic (element-at byte-list (mod (/ n u79228162514264337593543950336) u256)))
		(concat (unwrap-panic (element-at byte-list (mod (/ n u309485009821345068724781056) u256)))
		(concat (unwrap-panic (element-at byte-list (mod (/ n u1208925819614629174706176) u256)))
		(concat (unwrap-panic (element-at byte-list (mod (/ n u4722366482869645213696) u256)))
		(concat (unwrap-panic (element-at byte-list (mod (/ n u18446744073709551616) u256)))
		(concat (unwrap-panic (element-at byte-list (mod (/ n u72057594037927936) u256)))
		(concat (unwrap-panic (element-at byte-list (mod (/ n u281474976710656) u256)))
		(concat (unwrap-panic (element-at byte-list (mod (/ n u1099511627776) u256)))
		(concat (unwrap-panic (element-at byte-list (mod (/ n u4294967296) u256)))
		(concat (unwrap-panic (element-at byte-list (mod (/ n u16777216) u256)))
		(concat (unwrap-panic (element-at byte-list (mod (/ n u65536) u256)))
		(concat (unwrap-panic (element-at byte-list (mod (/ n u256) u256)))
						(unwrap-panic (element-at byte-list (mod n u256)))
		))))))))))))))))

(define-read-only (uint32-to-buff-be (n uint))
	(concat (unwrap-panic (element-at byte-list (mod (/ n u16777216) u256)))
		(concat (unwrap-panic (element-at byte-list (mod (/ n u65536) u256)))
		(concat (unwrap-panic (element-at byte-list (mod (/ n u256) u256)))
						(unwrap-panic (element-at byte-list (mod n u256))
		)))))

(define-private (string-ascii-to-buff-iter (c (string-ascii 1)) (a (buff 256)))
	(unwrap-panic (as-max-len? (concat a (string-ascii-to-byte c)) u256)))

(define-private (string-ascii-to-byte (c (string-ascii 1)))
	(unwrap-panic (element-at byte-list (unwrap-panic (index-of ascii-list c)))))

(define-constant type-id-uint 0x01)
(define-constant type-id-true 0x03)
(define-constant type-id-false 0x04)
(define-constant type-id-buff 0x02)
(define-constant type-id-none 0x09)
(define-constant type-id-some 0x0a)
(define-constant type-id-tuple 0x0c)
(define-constant type-id-ascii 0x0d)
(define-constant byte-list 0x000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f202122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f404142434445464748494a4b4c4d4e4f505152535455565758595a5b5c5d5e5f606162636465666768696a6b6c6d6e6f707172737475767778797a7b7c7d7e7f808182838485868788898a8b8c8d8e8f909192939495969798999a9b9c9d9e9fa0a1a2a3a4a5a6a7a8a9aaabacadaeafb0b1b2b3b4b5b6b7b8b9babbbcbdbebfc0c1c2c3c4c5c6c7c8c9cacbcccdcecfd0d1d2d3d4d5d6d7d8d9dadbdcdddedfe0e1e2e3e4e5e6e7e8e9eaebecedeeeff0f1f2f3f4f5f6f7f8f9fafbfcfdfeff)
(define-constant ascii-list "//////////////////////////////// !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////")
