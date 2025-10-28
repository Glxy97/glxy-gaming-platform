"""
Example usage of DataPad API integration.

This script demonstrates how to:
1. Check DataPad health
2. List available fields
3. Create new fields
4. Sync a form with DataPad
5. Monitor sync status
"""

import asyncio
import httpx


BASE_URL = "http://localhost:8000/api/datapad"


async def main():
    """Run DataPad integration examples."""
    async with httpx.AsyncClient() as client:
        print("=" * 60)
        print("DataPad Integration Examples")
        print("=" * 60)

        # 1. Health Check
        print("\n1. Health Check")
        print("-" * 60)
        response = await client.get(f"{BASE_URL}/health")
        health = response.json()
        print(f"Status: {health['status']}")
        print(f"API Available: {health['api_available']}")
        print(f"Authenticated: {health['authenticated']}")
        if health.get("details"):
            print(f"Details: {health['details']}")

        # 2. List Available Fields
        print("\n2. Available DataPad Fields")
        print("-" * 60)
        response = await client.get(f"{BASE_URL}/fields")
        fields_data = response.json()
        print(f"Total Fields: {fields_data['total']}")
        for field in fields_data["items"][:5]:  # Show first 5
            print(f"  - {field['label']} ({field['field_type']})")
            if field.get("group"):
                print(f"    Group: {field['group']}")

        # 3. Create New Field
        print("\n3. Create New Field")
        print("-" * 60)
        new_field = {
            "label": "Test Field",
            "field_type": "text",
            "group": "Testing",
            "required": False,
            "metadata": {"created_by": "example_script"},
        }
        response = await client.post(f"{BASE_URL}/fields", json=new_field)
        if response.status_code == 201:
            created = response.json()
            print(f"Created Field ID: {created['id']}")
            print(f"Label: {created['label']}")
            field_id = created["id"]

            # Clean up: Delete the test field
            print("\n  → Cleaning up test field...")
            delete_response = await client.delete(f"{BASE_URL}/fields/{field_id}")
            if delete_response.status_code == 204:
                print("  ✓ Test field deleted")
        else:
            print(f"Error creating field: {response.status_code}")

        # 4. List Field Mappings
        print("\n4. Field Mappings")
        print("-" * 60)
        response = await client.get(f"{BASE_URL}/mappings")
        mappings = response.json()
        print(f"Total Mappings: {len(mappings)}")
        for mapping in mappings[:3]:  # Show first 3
            print(f"  - PDF Field {mapping['pdf_field_id']} → DataPad {mapping['datapad_field_id']}")
            print(f"    Status: {mapping['status']}")

        # 5. Sync Form (Example - form must exist)
        print("\n5. Form Synchronization")
        print("-" * 60)
        form_id = 1  # Example form ID
        sync_payload = {
            "form_id": form_id,
            "force": False,
            "conflict_resolution": "skip",
        }

        print(f"Starting sync for form {form_id}...")
        response = await client.post(f"{BASE_URL}/forms/{form_id}/sync", json=sync_payload)

        if response.status_code == 200:
            sync_result = response.json()
            print(f"Sync Status: {sync_result['status']}")
            print(f"Summary:")
            for key, value in sync_result["summary"].items():
                print(f"  - {key}: {value}")

            # Show individual results
            print(f"\nField Results:")
            for result in sync_result["results"][:5]:  # Show first 5
                status_icon = "✓" if result["status"] == "synced" else "✗"
                print(f"  {status_icon} Field {result['field_id']}: {result['status']}")
                if result.get("error_message"):
                    print(f"    Error: {result['error_message']}")
        elif response.status_code == 404:
            print(f"Form {form_id} not found (expected for demo)")
        else:
            print(f"Sync failed: {response.status_code}")
            print(response.text)

        # 6. Check Sync Status
        print("\n6. Sync Status")
        print("-" * 60)
        response = await client.get(f"{BASE_URL}/forms/{form_id}/sync-status")

        if response.status_code == 200:
            status = response.json()
            print(f"Form: {status['form_id']}")
            print(f"Overall Status: {status['status']}")
            print(f"Progress:")
            print(f"  - Total Fields: {status['total_fields']}")
            print(f"  - Synced: {status['synced_fields']}")
            print(f"  - Pending: {status['pending_fields']}")
            print(f"  - Failed: {status['failed_fields']}")

            if status.get("errors"):
                print(f"\nErrors:")
                for error in status["errors"]:
                    print(f"  - {error}")
        elif response.status_code == 404:
            print(f"Form {form_id} not found (expected for demo)")

        print("\n" + "=" * 60)
        print("Examples completed!")
        print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
