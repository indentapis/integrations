#!/bin/bash -e

tmpLoc="$(mktemp)"

# Download file and ensure that checksum matches.
function main() {
	trap cleanup EXIT
	local url="${1}"
	local dst="${2}"
	local checksum="${3}"

	if [[ -z ${url} || -z ${dst} ]]; then
		echo "URL and Destination must be provided like: ${0} <url> <dst> [checksum]"
		exit 3
	elif [[ -f ${dst} ]]; then
		# check if already have copy
		check ${checksum} ${dst} && exit 0
	fi

	echo "Downloading ${url}..."
	curl -L -o ${tmpLoc} "${url}"

	echo "Checking checksum of ${dst}"
	check ${checksum} ${tmpLoc} || (echo "Failed checksum!" && exit 2)
	echo "Checksum passed!"

	mkdir -p $(dirname ${dst})
	mv ${tmpLoc} ${dst}
}

function check() {
	local checksum="${1}"
	local target="${2}"

	if [[ -z ${checksum} ]]; then
		return false
	fi

	echo "${checksum} ${target}" | sha256sum --check --status
}

function cleanup() {
	rm -f ${tmpLoc}
}

main "$@"