;; oracle-registry-v1-02
;;
;; store the state (user balance, inscription usage)
;;

(define-constant ERR-NOT-AUTHORIZED (err u1000))
(define-constant ERR-PAUSED (err u1001))
(define-constant ERR-TX-NOT-MINED (err u1002))
(define-constant ERR-TX-NOT-INDEXED (err u1003))

(define-data-var contract-owner principal tx-sender)

(define-data-var is-paused bool true)

(define-map bitcoin-tx-mined (buff 8192) uint)
(define-map bitcoin-tx-indexed { tx-hash: (buff 8192), output: uint, offset: uint } { tick: (string-utf8 4), amt: uint, from: (buff 128), to: (buff 128) })

;; governance functions

(define-public (set-paused (paused bool))
	(begin
		(try! (check-is-owner))
		(ok (var-set is-paused paused))))

(define-public (approve-operator (operator principal) (approved bool))
	(begin
		(try! (check-is-owner))
		(as-contract (contract-call? .oracle-registry-v1-01 approve-operator operator approved))))

(define-public (set-contract-owner (owner principal))
	(begin
		(try! (check-is-owner))
		(ok (var-set contract-owner owner))))

(define-public (set-paused-legacy (paused bool))
	(begin
		(try! (check-is-owner))
		(as-contract (contract-call? .oracle-registry-v1-01 set-paused paused))))

(define-public (set-contract-owner-legacy (owner principal))
	(begin
		(try! (check-is-owner))
		(as-contract (contract-call? .oracle-registry-v1-01 set-contract-owner owner))))

;; read-only functions

(define-read-only (get-contract-owner)
	(var-get contract-owner))

(define-read-only (get-paused)
	(var-get is-paused))

(define-read-only (get-approved-operator-or-default (operator principal))
	(contract-call? .oracle-registry-v1-01 get-approved-operator-or-default operator))

(define-read-only (get-user-balance-or-default (user (buff 128)) (tick (string-utf8 4)))
	(contract-call? .oracle-registry-v1-01 get-user-balance-or-default user tick))

(define-read-only (get-tick-decimals-or-default (tick (string-utf8 4)))
	(contract-call? .oracle-registry-v1-01 get-tick-decimals-or-default tick))

(define-read-only (get-bitcoin-tx-mined-or-fail (tx (buff 8192)))
	(match (as-max-len? tx u4096)
		some-value
		(match (contract-call? .oracle-registry-v1-01 get-bitcoin-tx-mined-or-fail some-value)
			ok-value (ok ok-value)			
			err-value (ok (unwrap! (map-get? bitcoin-tx-mined tx) ERR-TX-NOT-MINED)))
		(ok (unwrap! (map-get? bitcoin-tx-mined tx) ERR-TX-NOT-MINED))))		

(define-read-only (get-bitcoin-tx-indexed-or-fail (bitcoin-tx (buff 8192)) (output uint) (offset uint))
	(match (as-max-len? bitcoin-tx u4096)
		some-value
		(match (contract-call? .oracle-registry-v1-01 get-bitcoin-tx-indexed-or-fail some-value output offset)
			ok-value (ok ok-value)
			err-value (ok (unwrap! (map-get? bitcoin-tx-indexed { tx-hash: bitcoin-tx, output: output, offset: offset }) ERR-TX-NOT-INDEXED)))
		(ok (unwrap! (map-get? bitcoin-tx-indexed { tx-hash: bitcoin-tx, output: output, offset: offset }) ERR-TX-NOT-INDEXED))))		

;; privileged functions

(define-public (set-tick-decimals (tick (string-utf8 4)) (decimals uint))
	(begin 
		(try! (check-is-approved))
		(asserts! (not (var-get is-paused)) ERR-PAUSED)
		(as-contract (contract-call? .oracle-registry-v1-01 set-tick-decimals tick decimals))))

(define-public (set-user-balance (key { user: (buff 128), tick: (string-utf8 4) }) (value { balance: uint, up-to-block: uint }))
	(begin
		(try! (check-is-approved))
		(asserts! (not (var-get is-paused)) ERR-PAUSED)
		(as-contract (contract-call? .oracle-registry-v1-01 set-user-balance key value))))

(define-public (set-tx-mined (key (buff 8192)) (value uint))
	(begin 
		(try! (check-is-approved))
		(asserts! (not (var-get is-paused)) ERR-PAUSED)
		(print { type: "tx-mined", tx-hash: key })
		(ok (map-set bitcoin-tx-mined key value))))

(define-public (set-tx-indexed (key { tx-hash: (buff 8192), output: uint, offset: uint }) (value { tick: (string-utf8 4), amt: uint, from: (buff 128), to: (buff 128) }))
	(begin 
		(try! (check-is-approved))
		(asserts! (not (var-get is-paused)) ERR-PAUSED)
		(print { type: "tx-indexed", tx-hash: (get tx-hash key), output: (get output key), offset: (get offset key), tick: (get tick value), amt: (get amt value), from: (get from value), to: (get to value) })
		(ok (map-set bitcoin-tx-indexed key value))))

;; internal functions

(define-private (check-is-approved)
	(ok (asserts! (or (get-approved-operator-or-default tx-sender) (is-ok (check-is-owner))) ERR-NOT-AUTHORIZED))
)

(define-private (check-is-owner)
	(ok (asserts! (is-eq (var-get contract-owner) tx-sender) ERR-NOT-AUTHORIZED)))
