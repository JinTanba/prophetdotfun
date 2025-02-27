from dkg import DKG
from typing import Literal, Dict, Any, Optional
from dkg.providers import BlockchainProvider, NodeHTTPProvider
import json
import os
import sys
import hashlib
from pathlib import Path
from dotenv import load_dotenv

PROPHET_JSONLD_CONTEXT = {
    "@vocab": "https://schema.org/",
    "prophet": "https://github.com/yourusername/prophet-project/blob/main/ontology/terms.md#prophet",
    "embededProphet": "https://github.com/yourusername/prophet-project/blob/main/ontology/terms.md#embededProphet",
    "embededProphetHash": "https://github.com/yourusername/prophet-project/blob/main/ontology/terms.md#embededProphetHash"
}

DEFAULT_ASSET_OPTIONS = {
    "epochs_num": 1,
    "immutable": True,
    "minimum_number_of_node_replications": 1
}

rpc_endpoint = os.getenv("RPC_ENDPOINT_BC1", "http://127.0.0.1:9545")
node_provider = NodeHTTPProvider(endpoint_uri="https://sepolia.base.org", api_version="v1")
blockchain_provider = BlockchainProvider(
    environment="development",
    blockchain_id="base:84532",
    rpc_uri="https://sepolia.base.org"
)
dkg = DKG(node_provider, blockchain_provider)

def create_knowledge(prophet_data: Dict[str, Any], options: Optional[Dict[str, Any]] = None) -> str:
    final_options = DEFAULT_ASSET_OPTIONS.copy()
    if options:
        final_options.update(options)

    content = {
        "public": [
            {
                "@context": PROPHET_JSONLD_CONTEXT,
                "@id": f"urn:prophet:{hashlib.md5(prophet_data['prophet'].encode()).hexdigest()}",
                "@type": "Dataset",
                **prophet_data
            }
        ]
    }

    try:
        result = dkg.asset.create(content, final_options)
        return result["UAL"]
    except Exception as e:
        raise

