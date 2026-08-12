"""
ADHD 코칭 AI 학습 데이터 추출기
PDF 논문 및 텍스트 파일에서 학습 데이터를 추출합니다.
"""

import os
import json
import re
from pathlib import Path
from typing import List, Dict

# PDF 처리
try:
    import fitz  # PyMuPDF
except ImportError:
    print("PyMuPDF 설치 필요: pip install PyMuPDF")
    fitz = None

# 텍스트 청킹
try:
    from langchain.text_splitter import RecursiveCharacterTextSplitter
except ImportError:
    print("langchain 설치 필요: pip install langchain")
    RecursiveCharacterTextSplitter = None


class ADHDDataExtractor:
    """ADHD 관련 문서에서 학습 데이터 추출"""

    def __init__(self, input_dir: str, output_dir: str):
        self.input_dir = Path(input_dir)
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

        # 텍스트 청킹 설정
        if RecursiveCharacterTextSplitter:
            self.text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=1000,
                chunk_overlap=200,
                separators=["\n\n", "\n", ".", "!", "?", ",", " "]
            )
        else:
            self.text_splitter = None

    def extract_from_pdf(self, pdf_path: Path) -> str:
        """PDF에서 텍스트 추출"""
        if not fitz:
            raise ImportError("PyMuPDF가 필요합니다")

        text = ""
        try:
            doc = fitz.open(pdf_path)
            for page in doc:
                text += page.get_text()
            doc.close()
        except Exception as e:
            print(f"PDF 추출 실패 ({pdf_path}): {e}")

        return self._clean_text(text)

    def extract_from_txt(self, txt_path: Path) -> str:
        """텍스트 파일에서 내용 추출"""
        encodings = ['utf-8', 'cp949', 'euc-kr', 'utf-16']

        for encoding in encodings:
            try:
                with open(txt_path, 'r', encoding=encoding) as f:
                    text = f.read()
                return self._clean_text(text)
            except UnicodeDecodeError:
                continue

        print(f"텍스트 파일 읽기 실패 ({txt_path})")
        return ""

    def _clean_text(self, text: str) -> str:
        """텍스트 정리"""
        # 여러 공백을 하나로
        text = re.sub(r'\s+', ' ', text)
        # 특수문자 정리
        text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]', '', text)
        return text.strip()

    def chunk_text(self, text: str) -> List[str]:
        """텍스트를 청크로 분할"""
        if self.text_splitter:
            return self.text_splitter.split_text(text)
        else:
            # 수동 분할 (langchain 없을 때)
            chunks = []
            words = text.split()
            current_chunk = []
            current_length = 0

            for word in words:
                current_chunk.append(word)
                current_length += len(word) + 1

                if current_length >= 800:
                    chunks.append(' '.join(current_chunk))
                    current_chunk = current_chunk[-50:]  # 오버랩
                    current_length = sum(len(w) + 1 for w in current_chunk)

            if current_chunk:
                chunks.append(' '.join(current_chunk))

            return chunks

    def process_all_files(self) -> Dict:
        """모든 파일 처리"""
        results = {
            "total_files": 0,
            "total_chunks": 0,
            "files": []
        }

        # PDF 파일 처리
        for pdf_path in self.input_dir.glob("**/*.pdf"):
            print(f"처리 중: {pdf_path.name}")
            text = self.extract_from_pdf(pdf_path)
            if text:
                chunks = self.chunk_text(text)
                results["files"].append({
                    "name": pdf_path.name,
                    "type": "pdf",
                    "chunks": len(chunks),
                    "content": chunks
                })
                results["total_chunks"] += len(chunks)
                results["total_files"] += 1

        # 텍스트 파일 처리
        for txt_path in self.input_dir.glob("**/*.txt"):
            print(f"처리 중: {txt_path.name}")
            text = self.extract_from_txt(txt_path)
            if text:
                chunks = self.chunk_text(text)
                results["files"].append({
                    "name": txt_path.name,
                    "type": "txt",
                    "chunks": len(chunks),
                    "content": chunks
                })
                results["total_chunks"] += len(chunks)
                results["total_files"] += 1

        # 결과 저장
        output_path = self.output_dir / "extracted_chunks.json"
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2)

        print(f"\n추출 완료!")
        print(f"- 총 파일: {results['total_files']}개")
        print(f"- 총 청크: {results['total_chunks']}개")
        print(f"- 저장 위치: {output_path}")

        return results


def main():
    """메인 실행"""
    import argparse

    parser = argparse.ArgumentParser(description='ADHD 학습 데이터 추출')
    parser.add_argument('--input', '-i', required=True, help='입력 폴더 (PDF/TXT 파일 위치)')
    parser.add_argument('--output', '-o', default='./output', help='출력 폴더')

    args = parser.parse_args()

    extractor = ADHDDataExtractor(args.input, args.output)
    extractor.process_all_files()


if __name__ == "__main__":
    main()
