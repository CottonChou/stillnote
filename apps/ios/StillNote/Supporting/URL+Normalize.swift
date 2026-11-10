import Foundation

extension URL {
    /// Strip trailing slashes for stable instance keys / API base URLs.
    var stillNoteNormalizedBase: URL {
        var absolute = absoluteString
        while absolute.hasSuffix("/") {
            absolute.removeLast()
        }
        return URL(string: absolute) ?? self
    }
}

enum StillNotePublicDemo {
    static let instanceURLString = "https://demo.stillnote.org"
}

enum StillNoteURLNormalizer {
    static func normalizeInstanceURL(_ raw: String) throws -> URL {
        var trimmed = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        if trimmed.isEmpty {
            throw StillNoteURLError.empty
        }
        if !trimmed.contains("://") {
            trimmed = "https://\(trimmed)"
        }
        guard var components = URLComponents(string: trimmed), let host = components.host, !host.isEmpty else {
            throw StillNoteURLError.invalid
        }
        if host.lowercased() == "demo" {
            components.scheme = "https"
            components.host = "demo.stillnote.org"
        }
        components.fragment = nil
        components.query = nil
        guard let url = components.url else {
            throw StillNoteURLError.invalid
        }
        return url.stillNoteNormalizedBase
    }
}

enum StillNoteURLError: LocalizedError {
    case empty
    case invalid

    var errorDescription: String? {
        switch self {
        case .empty:
            return "Instance URL is required."
        case .invalid:
            return "Instance URL is invalid."
        }
    }
}
