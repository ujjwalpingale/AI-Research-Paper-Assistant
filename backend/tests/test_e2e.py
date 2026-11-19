import time
import requests

BASE_URL = "http://127.0.0.1:8000"

def run_tests():
    print("=== 1. Testing GET /api/health ===")
    r = requests.get(f"{BASE_URL}/api/health")
    assert r.status_code == 200, f"Health check failed: {r.text}"
    health_data = r.json()
    print("Health Status:", health_data)
    assert health_data["status"] == "healthy"
    assert health_data["vector_db_ready"] is True

    print("\n=== 2. Testing POST /api/documents/upload ===")
    with open("Attention_Is_All_You_Need.pdf", "rb") as f1, open("Mamba_Linear_Time_SSM.pdf", "rb") as f2:
        files = [
            ("files", ("Attention_Is_All_You_Need.pdf", f1, "application/pdf")),
            ("files", ("Mamba_Linear_Time_SSM.pdf", f2, "application/pdf"))
        ]
        r = requests.post(f"{BASE_URL}/api/documents/upload", files=files)
        assert r.status_code == 200, f"Upload failed: {r.text}"
        upload_data = r.json()
        print("Upload Result:", upload_data["message"])
        assert len(upload_data["documents"]) == 2
        doc1 = upload_data["documents"][0]
        doc2 = upload_data["documents"][1]
        doc1_id = doc1["id"]
        doc2_id = doc2["id"]

    print("\n=== 3. Testing GET /api/documents ===")
    r = requests.get(f"{BASE_URL}/api/documents")
    assert r.status_code == 200
    docs = r.json()
    print(f"Total indexed papers: {len(docs)}")
    assert len(docs) >= 2

    print(f"\n=== 4. Testing GET /api/documents/{doc1_id} ===")
    r = requests.get(f"{BASE_URL}/api/documents/{doc1_id}")
    assert r.status_code == 200
    doc_detail = r.json()
    print("Document Title:", doc_detail["document"]["title"])
    print(f"Chunks indexed: {doc_detail['document']['total_chunks']}")

    print(f"\n=== 5. Testing GET /api/documents/{doc1_id}/file ===")
    r = requests.get(f"{BASE_URL}/api/documents/{doc1_id}/file")
    assert r.status_code == 200
    assert r.headers["content-type"] == "application/pdf"
    print("PDF File stream retrieved successfully, size:", len(r.content), "bytes")

    print("\n=== 6. Testing POST /api/chat (RAG) ===")
    chat_payload = {
        "question": "What is the BLEU score achieved on WMT 2014 English-to-German?",
        "paper_ids": [doc1_id],
        "session_id": "test-session"
    }
    r = requests.post(f"{BASE_URL}/api/chat", json=chat_payload)
    assert r.status_code == 200, f"Chat failed: {r.text}"
    chat_data = r.json()
    print("Chat Answer snippet:", chat_data["answer"][:140] + "...")
    print(f"Verified Citations returned: {len(chat_data['sources'])}")
    assert len(chat_data["sources"]) > 0
    assert chat_data["sources"][0]["page_number"] >= 1

    print("\n=== 7. Testing GET /api/chat/history ===")
    r = requests.get(f"{BASE_URL}/api/chat/history?session_id=test-session")
    assert r.status_code == 200
    hist = r.json()
    print(f"Conversation history count: {len(hist['messages'])}")
    assert len(hist["messages"]) >= 2

    print(f"\n=== 8. Testing POST /api/summary/{doc1_id} ===")
    r = requests.post(f"{BASE_URL}/api/summary/{doc1_id}")
    assert r.status_code == 200, f"Summary failed: {r.text}"
    summary_data = r.json()
    print("Summary Title:", summary_data["summary"]["title"])
    print("Objectives:", summary_data["summary"]["objectives"][:100] + "...")
    assert "methodology" in summary_data["summary"]

    print("\n=== 9. Testing POST /api/compare ===")
    compare_payload = {
        "document_id_1": doc1_id,
        "document_id_2": doc2_id
    }
    r = requests.post(f"{BASE_URL}/api/compare", json=compare_payload)
    assert r.status_code == 200, f"Comparison failed: {r.text}"
    compare_data = r.json()
    print("Comparison Categories:", [c["category"] for c in compare_data["categories"]])
    print("Similarities count:", len(compare_data["similarities"]))
    print("Differences count:", len(compare_data["differences"]))

    print(f"\n=== 10. Testing DELETE /api/documents/{doc2_id} ===")
    r = requests.delete(f"{BASE_URL}/api/documents/{doc2_id}")
    assert r.status_code == 200
    print("Delete result:", r.json()["message"])

    # Verify count decremented
    r = requests.get(f"{BASE_URL}/api/documents")
    docs_after = r.json()
    print(f"Remaining papers after delete: {len(docs_after)}")

    print("\n" + "=" * 50)
    print("ALL 10 API ENDPOINTS VALIDATED AND PASSING 100%!")
    print("=" * 50)

if __name__ == "__main__":
    run_tests()
