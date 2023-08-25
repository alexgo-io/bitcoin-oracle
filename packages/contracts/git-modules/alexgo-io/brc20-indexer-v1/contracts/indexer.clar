;; indexer
;;
;; guardians validate tx submitted
;; verifies tx submitted was mined
;; updates the state (user balance, inscription usage)
;;
;; TODO: separation of logic and storage

(define-constant ERR-NOT-AUTHORIZED (err u1000))
(define-constant ERR-TX-NOT-MINED (err u1001))
(define-constant ERR-UNKNOWN-VALIDATOR (err u1002))
(define-constant ERR-PAUSED (err u1004))
(define-constant ERR-UKNOWN-RELAYER (err u1005))
(define-constant ERR-REQUIRED-VALIDATORS (err u1006))
(define-constant ERR-TX-ALREADY-INDEXED (err u1007))
(define-constant ERR-DOUBLE-SPEND (err u1011))
(define-constant ERR-FROM-BAL-MISMATCH (err u1012))
(define-constant ERR-TO-BAL-MISMATCH (err u1013))
(define-constant ERR-UKNOWN-TYPE (err u1014))
(define-constant ERR-VALIDATOR-ALREADY-REGISTERED (err u1015))
(define-constant ERR-TX-NOT-INDEXED (err u1016))
(define-constant ERR-DUPLICATE-SIGNATURE (err u1017))
(define-constant ERR-ORDER-HASH-MISMATCH (err u1018))
(define-constant ERR-INVALID-SIGNATURE (err u1019))

(define-constant MAX_UINT u340282366920938463463374607431768211455)
(define-constant ONE_8 u100000000)
(define-constant MAX_REQUIRED_VALIDATORS u10)

(define-constant structured-data-prefix 0x534950303138)
;; const domainHash = structuredDataHash(
;;   tupleCV({
;;     name: stringAsciiCV('ALEX BRC20 Indexer'),
;;     version: stringAsciiCV('0.0.1'),
;;     'chain-id': uintCV(new StacksMainnet().chainId) | uintCV(new StacksMocknet().chainId),
;;   }),
;; );
;; (define-constant message-domain 0x6d11cd301d11961e7cfeabd61e3f4da17f42f3d627362c8878aa9cbb5c532be2) ;;mainnet
(define-constant message-domain 0x84deb9a3b41b870d85819000deefa999f43b1bf2c3d80c3ea19d4b83b7b10fbc) ;; testnet

(define-data-var contract-owner principal tx-sender)
(define-map approved-relayers principal bool)

(define-data-var is-paused bool true)

(define-map validators principal (buff 33))
(define-data-var validator-count uint u0)
(define-data-var required-validators uint MAX_UINT)

(define-map bitcoin-tx-indexed { tx-hash: (buff 4096), output: uint } { tick: (string-utf8 4), amt: uint, from: (buff 128), to: (buff 128) })
(define-map tx-validated-by { tx-hash: (buff 32), validator: principal } bool)

;; tracks user balance by tick
(define-map user-balance { user: (buff 128), tick: (string-utf8 4) } uint)

(define-data-var tx-hash-to-iter (buff 32) 0x)

;; governance functions

(define-public (set-paused (paused bool))
	(begin
		(try! (check-is-owner))
		(ok (var-set is-paused paused))))

(define-public (add-validator (validator-pubkey (buff 33)) (validator principal))
	(begin
		(try! (check-is-owner))
		(asserts! (is-none (map-get? validators validator)) ERR-VALIDATOR-ALREADY-REGISTERED)
		(map-set validators validator validator-pubkey)
		(var-set validator-count (+ u1 (var-get validator-count)))
		(ok (var-get validator-count))))

(define-public (remove-validator (validator principal))
	(begin
		(try! (check-is-owner))
		(asserts! (is-some (map-get? validators validator)) ERR-UNKNOWN-VALIDATOR)
		(map-delete validators validator)
		(var-set validator-count (- (var-get validator-count) u1))
		(ok (var-get validator-count))))

(define-public (approve-relayer (relayer principal) (approved bool))
	(begin
		(try! (check-is-owner))
		(ok (map-set approved-relayers relayer approved))))

(define-public (set-required-validators (new-required-validators uint))
	(begin
		(try! (check-is-owner))
		(asserts! (< new-required-validators MAX_REQUIRED_VALIDATORS) ERR-REQUIRED-VALIDATORS)
		(ok (var-set required-validators new-required-validators))))

(define-public (set-contract-owner (owner principal))
	(begin
		(try! (check-is-owner))
		(ok (var-set contract-owner owner))))

(define-public (set-user-balance (user (buff 128)) (tick (string-utf8 4)) (amt uint))
	(begin
		(try! (check-is-owner))
		(ok (map-set user-balance { user: user, tick: tick } amt))))

;; read-only functions

(define-read-only (get-contract-owner)
	(var-get contract-owner))

(define-read-only (get-validator-or-fail (validator principal))
	(ok (unwrap! (map-get? validators validator) ERR-UNKNOWN-VALIDATOR)))

(define-read-only (get-required-validators)
	(var-get required-validators))

(define-read-only (hash-tx (tx { bitcoin-tx: (buff 4096), output: uint, tick: (string-utf8 4), amt: uint, from: (buff 128), to: (buff 128), from-bal: uint, to-bal: uint } ))
	(sha256 (default-to 0x (to-consensus-buff? tx))))

(define-read-only (get-paused)
	(var-get is-paused))

(define-read-only (get-user-balance-or-default (user (buff 128)) (tick (string-utf8 4)))
	(default-to u0 (map-get? user-balance { user: user, tick: tick })))

(define-read-only (validate-tx (tx-hash (buff 32)) (signature-pack { signer: principal, tx-hash: (buff 32), signature: (buff 65)}))
	(let (
			(validator-pubkey (try! (get-validator-or-fail (get signer signature-pack)))))
		(asserts! (is-none (map-get? tx-validated-by { tx-hash: tx-hash, validator: (get signer signature-pack) })) ERR-DUPLICATE-SIGNATURE)
		(asserts! (is-eq tx-hash (get tx-hash signature-pack)) ERR-ORDER-HASH-MISMATCH)
		(ok (asserts! (is-eq (secp256k1-recover? (sha256 (concat structured-data-prefix (concat message-domain tx-hash))) (get signature signature-pack)) (ok validator-pubkey)) ERR-INVALID-SIGNATURE))))

(define-read-only (verify-mined (tx (buff 4096)) (block { header: (buff 80), height: uint }) (proof { tx-index: uint, hashes: (list 14 (buff 32)), tree-depth: uint }))
	(contract-call? .clarity-bitcoin was-segwit-tx-mined? block tx proof))

(define-read-only (get-bitcoin-tx-indexed-or-fail (bitcoin-tx (buff 4096)) (output uint))
	(ok (unwrap! (map-get? bitcoin-tx-indexed { tx-hash: bitcoin-tx, output: output }) ERR-TX-NOT-INDEXED)))

;; external functions

(define-public (index-tx-many
		(tx-many (list 25 {
			tx: { bitcoin-tx: (buff 4096), output: uint, tick: (string-utf8 4), amt: uint, from: (buff 128), to: (buff 128), from-bal: uint, to-bal: uint },
			block: { header: (buff 80), height: uint },
			proof: { tx-index: uint, hashes: (list 14 (buff 32)), tree-depth: uint },
			signature-packs: (list 10 { signer: principal, tx-hash: (buff 32), signature: (buff 65) })})))
	(begin
		(asserts! (not (var-get is-paused)) ERR-PAUSED)
		(asserts! (is-some (map-get? approved-relayers tx-sender)) ERR-UKNOWN-RELAYER)
		(fold index-tx-iter tx-many (ok true))))

;; internal functions

(define-private (validate-signature-iter
		(signature-pack { signer: principal, tx-hash: (buff 32), signature: (buff 65)})
		(previous-response (response bool uint)))
	(match previous-response
		prev-ok
		(begin
			(try! (validate-tx (var-get tx-hash-to-iter) signature-pack))
			(ok (map-set tx-validated-by { tx-hash: (var-get tx-hash-to-iter), validator: (get signer signature-pack) } true)))
		prev-err
		previous-response))

(define-private (index-tx-iter
		(signed-tx {
			tx: { bitcoin-tx: (buff 4096), output: uint, tick: (string-utf8 4), amt: uint, from: (buff 128), to: (buff 128), from-bal: uint, to-bal: uint },
			block: { header: (buff 80), height: uint },
			proof: { tx-index: uint, hashes: (list 14 (buff 32)), tree-depth: uint },
			signature-packs: (list 10 { signer: principal, tx-hash: (buff 32), signature: (buff 65)}) })
		(previous-response (response bool uint)))
	(match previous-response
		prev-ok
		(let (
				(tx (get tx signed-tx))
				(signature-packs (get signature-packs signed-tx))
				(tx-hash (hash-tx tx))
				(from-bal-key { user: (get from tx), tick: (get tick tx) })
				(to-bal-key { user: (get to tx), tick: (get tick tx) })
				(from-bal-indexed (and (is-none (map-get? user-balance from-bal-key)) (map-set user-balance from-bal-key (get from-bal tx))))
				(to-bal-indexed (and (is-none (map-get? user-balance to-bal-key)) (map-set user-balance to-bal-key (get to-bal tx))))
				(from-bal (get-user-balance-or-default (get user from-bal-key) (get tick from-bal-key)))
				(to-bal (get-user-balance-or-default (get user to-bal-key) (get tick to-bal-key))))
			(asserts! (is-err (get-bitcoin-tx-indexed-or-fail (get bitcoin-tx tx) (get output tx))) ERR-TX-ALREADY-INDEXED)
			(asserts! (>= (len signature-packs) (var-get required-validators)) ERR-REQUIRED-VALIDATORS)
			(asserts! (<= (get amt tx) from-bal) ERR-DOUBLE-SPEND)
			(asserts! (is-eq from-bal (get from-bal tx)) ERR-FROM-BAL-MISMATCH)
			(asserts! (is-eq to-bal (get to-bal tx)) ERR-TO-BAL-MISMATCH)

			(try! (verify-mined (get bitcoin-tx tx) (get block signed-tx) (get proof signed-tx)))

			(var-set tx-hash-to-iter tx-hash)
			(try! (fold validate-signature-iter signature-packs (ok true)))

			(map-set bitcoin-tx-indexed { tx-hash: (get bitcoin-tx tx), output: (get output tx) } { tick: (get tick tx), amt: (get amt tx), from: (get from tx), to: (get to tx) })
			(map-set user-balance from-bal-key (- from-bal (get amt tx)))
			(ok (map-set user-balance to-bal-key (+ to-bal (get amt tx)))))
		prev-err
		previous-response))

(define-private (check-is-owner)
	(ok (asserts! (is-eq (var-get contract-owner) tx-sender) ERR-NOT-AUTHORIZED)))
