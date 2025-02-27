import os
import asyncio
from typing import List, Dict, Any, Optional, Union
from sentence_transformers import SentenceTransformer
from supabase import create_client, Client
import hashlib
import json

class Prophet:
    def __init__(self, 
                 model_name: str = "BAAI/bge-large-en",
                 supabase_url: Optional[str] = None,
                 supabase_key: Optional[str] = None,
                 table_name: str = "prophecy_vectors"):
        """
        Initialize the Prophet with embedding model and database connection.
        
        Args:
            model_name: Name of the sentence transformer model to use
            supabase_url: Supabase URL (defaults to environment variable)
            supabase_key: Supabase API key (defaults to environment variable)
            table_name: Name of the table to store vectors in
        """
        self.model_name = model_name
        self.model = self._initialize_model()
        self.table_name = table_name
        
        # Initialize Supabase client if credentials are provided
        self.supabase: Optional[Client] = None
        if supabase_url and supabase_key:
            self.supabase = create_client(supabase_url, supabase_key)
        else:
            url = os.getenv("SUPABASE_URL")
            key = os.getenv("SUPABASE_KEY")
            if url and key:
                self.supabase = create_client(url, key)
    
    def _initialize_model(self) -> SentenceTransformer:
        """
        Initialize the embedding model.
        
        Returns:
            Initialized SentenceTransformer model
        """
        print(f"Loading model: {self.model_name}")
        return SentenceTransformer(self.model_name)
    
    def embed_text(self, text: Union[str, List[str]]) -> Union[List[float], List[List[float]]]:
        """
        Convert text to vector embeddings.
        
        Args:
            text: Single text string or list of text strings to embed
            
        Returns:
            Embedding vector(s) as list of floats or list of list of floats
        
        Raises:
            ValueError: If text is empty or None
        """
        if not text:
            raise ValueError("Text cannot be empty or None")
            
        try:
            # Handle single string or list of strings
            is_single_text = isinstance(text, str)
            input_texts = [text] if is_single_text else text
            
            embeddings = self.model.encode(input_texts, normalize_embeddings=True)

            embedding_lists = [embedding.tolist() for embedding in embeddings]

            return embedding_lists[0] if is_single_text else embedding_lists
            
        except Exception as e:
            print(f"Error during text embedding: {e}")
            raise
    
    async def store_vector(self, 
                          id: str, 
                          text: str, 
                          metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Store vector embedding and metadata in the database.
        
        Args:
            id: Unique identifier for the embedding
            text: Text to embed and store
            metadata: Additional metadata to store with the embedding
            
        Returns:
            Response data from the database
            
        Raises:
            ConnectionError: If Supabase client is not initialized
            ValueError: If text is empty or None
        """
        if not self.supabase:
            raise ConnectionError("Supabase client not initialized")
            
        try:
            # Generate embedding
            embedding = self.embed_text(text)
            
            # Prepare data
            data = {
                "prophecy_id": id,
                "embedding": embedding,
                "text": text
            }
            
            # Add metadata if provided
            if metadata:
                data.update(metadata)
                
            # Insert into database
            response = self.supabase.table(self.table_name).insert(data).execute()
            print(f"Successfully stored vector for id: {id}")
            return response.data
            
        except Exception as e:
            print(f"Error storing vector in database: {e}")
            raise
    
    async def find_similar(self, 
                          text: str, 
                          limit: int = 5, 
                          threshold: float = 0.7,
                          rpc_name: str = 'match_prophecies') -> List[Dict[str, Any]]:
        """
        Find similar items in the vector database based on text similarity.
        
        Args:
            text: Query text to find similar items for
            limit: Maximum number of results to return
            threshold: Similarity threshold (0-1)
            rpc_name: Name of the RPC function in Supabase
            
        Returns:
            List of similar items with their metadata
            
        Raises:
            ConnectionError: If Supabase client is not initialized
        """
        if not self.supabase:
            raise ConnectionError("Supabase client not initialized")
            
        try:
            # Generate query embedding
            query_embedding = self.embed_text(text)
            
            # Perform similarity search
            response = self.supabase.rpc(
                rpc_name,
                {
                    'query_embedding': query_embedding,
                    'match_threshold': threshold,
                    'match_count': limit
                }
            ).execute()
            
            return response.data
            
        except Exception as e:
            print(f"Error during similarity search: {e}")
            raise
    
    def batch_embed(self, texts: List[str]) -> List[List[float]]:
        """
        Batch embed multiple texts efficiently.
        
        Args:
            texts: List of text strings to embed
            
        Returns:
            List of embedding vectors
        """
        return self.embed_text(texts)
    
    async def batch_store(self, 
                         items: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Store multiple vectors efficiently in a single operation.
        
        Args:
            items: List of dictionaries with 'id', 'text', and optional 'metadata'
            
        Returns:
            Response data from the database
            
        Raises:
            ConnectionError: If Supabase client is not initialized
        """
        if not self.supabase:
            raise ConnectionError("Supabase client not initialized")
            
        try:
            # Process each item
            data_to_insert = []
            for item in items:
                if 'id' not in item or 'text' not in item:
                    raise ValueError("Each item must contain 'id' and 'text' keys")
                
                # Generate embedding
                embedding = self.embed_text(item['text'])
                
                # Prepare record
                record = {
                    "prophecy_id": item['id'],
                    "embedding": embedding,
                    "text": item['text']
                }
                
                if 'metadata' in item and item['metadata']:
                    record.update(item['metadata'])
                
                data_to_insert.append(record)
                
            # Insert all records
            response = self.supabase.table(self.table_name).insert(data_to_insert).execute()
            print(f"Successfully stored {len(data_to_insert)} vectors")
            return response.data
            
        except Exception as e:
            print(f"Error batch storing vectors: {e}")
            raise
    
    def export_vectors(self, ids: Optional[List[str]] = None) -> Dict[str, Any]:
        """
        Export vectors and metadata from the database.
        
        Args:
            ids: Optional list of specific IDs to export
            
        Returns:
            Dictionary with vectors and metadata
            
        Raises:
            ConnectionError: If Supabase client is not initialized
        """
        if not self.supabase:
            raise ConnectionError("Supabase client not initialized")
            
        try:
            query = self.supabase.table(self.table_name)
            
            # Filter by IDs if provided
            if ids:
                query = query.in_("prophecy_id", ids)
                
            response = query.execute()
            return response.data
            
        except Exception as e:
            print(f"Error exporting vectors: {e}")
            raise
            
    def generate_prophet_data(self, text: str, hash_method: str = 'sha256') -> Dict[str, Any]:
        """
        Generate and return prophet data with original text, embedded vector, and hash.
        
        Args:
            text: Prophet text to embed
            hash_method: Hashing algorithm to use ('sha256', 'md5', 'sha1')
            
        Returns:
            Dictionary containing:
                - prophet: Original text
                - embededProphet: Vector embedding
                - embededProphetHash: Hash of the embedding
                
        Raises:
            ValueError: If an unsupported hash method is specified
        """

        # Support for different hash methods
        if hash_method not in ['sha256', 'md5', 'sha1']:
            raise ValueError(f"Unsupported hash method: {hash_method}. Use 'sha256', 'md5', or 'sha1'")
        
        try:
            embedded_prophet = self.embed_text(text)
            embedding_json = json.dumps(embedded_prophet, sort_keys=True)
            
            # Create hash based on specified method
            if hash_method == 'sha256':
                embedded_prophet_hash = hashlib.sha256(embedding_json.encode()).hexdigest()
            elif hash_method == 'md5':
                embedded_prophet_hash = hashlib.md5(embedding_json.encode()).hexdigest()
            else:  # sha1
                embedded_prophet_hash = hashlib.sha1(embedding_json.encode()).hexdigest()
            
            # Return the prophet data in the requested format
            return {
                "prophet": text,
                "embededProphet": embedded_prophet,
                "embededProphetHash": embedded_prophet_hash
            }
            
        except Exception as e:
            print(f"Error generating prophet data: {e}")
            raise