import XCTest
@testable import StillNote

final class URLNormalizeTests: XCTestCase {
    func testDirectTagSuggestionsKeepCanonicalNamesAndExcludeCurrentTags() {
        let result = AiDirectStream.tagSuggestions("<stillnote-tags>\nreact\nReact\n#Current\nnew-topic\n</stillnote-tags>", currentTags: ["Current"], canonicalTags: ["react": "React"])
        XCTAssertEqual(result.map(\.name), ["React", "new-topic"])
        XCTAssertEqual(result.map(\.existing), [true, false])
        let json = AiDirectStream.tagSuggestions(#"{"suggestions":[{"name":"react"},"Current","one","two","three"]}"#, currentTags: ["Current"], canonicalTags: ["react": "React"])
        XCTAssertEqual(json.map(\.name), ["React", "one", "two"])
        XCTAssertTrue(AiDirectStream.tagSuggestions(#"{"suggestions":[]}"#, currentTags: [], canonicalTags: [:]).isEmpty)
    }

    func testDirectModelRequestsUseTheConfiguredPrivateEndpoint() throws {
        let prepared = AiPreparedGeneration(provider: "openai-compatible", baseUrl: "http://192.168.1.20:11434/v1", apiKey: "model-key", modelId: "local", system: "Suggest tags", prompt: "Body", maxOutputTokens: 300, resultBoundary: .init(start: "", end: ""))
        let request = try AiDirectStream.providerRequest(for: prepared)
        XCTAssertFalse(request.httpShouldHandleCookies)
        XCTAssertEqual(request.url?.absoluteString, "http://192.168.1.20:11434/v1/chat/completions")
        XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer model-key")
    }

    func testAddsHTTPS() throws {
        let url = try StillNoteURLNormalizer.normalizeInstanceURL("demo.stillnote.org")
        XCTAssertEqual(url.absoluteString, "https://demo.stillnote.org")
    }

    func testStripsTrailingSlash() throws {
        let url = try StillNoteURLNormalizer.normalizeInstanceURL("https://demo.stillnote.org/")
        XCTAssertEqual(url.absoluteString, "https://demo.stillnote.org")
    }

    func testRejectsEmpty() {
        XCTAssertThrowsError(try StillNoteURLNormalizer.normalizeInstanceURL("  "))
    }

    func testMapsBareDemoAliasToPublicInstance() throws {
        XCTAssertEqual(
            try StillNoteURLNormalizer.normalizeInstanceURL("demo").absoluteString,
            StillNotePublicDemo.instanceURLString
        )
        XCTAssertEqual(
            try StillNoteURLNormalizer.normalizeInstanceURL("https://demo").absoluteString,
            StillNotePublicDemo.instanceURLString
        )
        XCTAssertEqual(
            try StillNoteURLNormalizer.normalizeInstanceURL("DEMO/").absoluteString,
            StillNotePublicDemo.instanceURLString
        )
    }
}
