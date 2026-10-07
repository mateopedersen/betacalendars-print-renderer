# Security

The production container uses the unprivileged Node `node` account (UID 1000), contains only application source and package metadata, and has no third-party runtime dependencies. A writable `/output` mount is used for files; the application can otherwise run with a read-only root filesystem.

The HTTP server accepts GET requests only and has no mutation endpoints. Rendering is local and does not perform outbound network requests. Do not expose the service directly to an untrusted public network without placing it behind your normal access controls and resource limits.

Report a vulnerability privately to the repository owner through GitHub’s security reporting feature. Do not include exploit details in a public issue before a fix is available.
