.PHONY: copybara

COPYBARA_JAR_URL := https://storage.googleapis.com/indent-artifacts/copybara_deploy.jar
COPYBARA_JAR_SHA := df21801c9aa21173662e3681e9107867de7136bee46f9c66551247294625e4f9

_out:
	mkdir $@

# Copybara code copying
COPYBARA_FLAGS :=
copybara: copybara-terraform
copybara-%: _out/copybara
	$< migrate copy.bara.sky $* ${GITHUB_REF} --force $(COPYBARA_FLAGS)

_out/copybara: _out/copybara.jar _out
	echo "java -jar $< \$$@" >$@
	chmod +x $@

_out/copybara.jar:
	./scripts/download.sh $(COPYBARA_JAR_URL) $@ $(COPYBARA_JAR_SHA)