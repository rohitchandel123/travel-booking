import './BlogDetailPage.css';
import { useParams } from 'react-router-dom';
import { ProjectImages } from '../../assets/ProjectImages';
import AddingComment from '../../Shared/AddingComment/AddingComment';
import { blogs, Blog } from '../BlogPage/Blogs';
import { useEffect, useState } from 'react';
import {
  FacebookShareButton,
  TwitterShareButton,
  WhatsappShareButton,
  LinkedinShareButton,
  FacebookIcon,
  TwitterIcon,
  WhatsappIcon,
  LinkedinIcon,
} from 'react-share';
import { db } from '../../firebaseConfig';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { toast } from 'react-toastify';

interface CommentData {
  id: string;
  name: string;
  textContent: string;
  timestamp: Timestamp;
  blogId: string;
}

function BlogDetailPage() {
  const { id } = useParams<{ id: string }>();
  const blog: Blog | undefined = blogs.find((b) => b.id === parseInt(id ?? ''));
  const [comments, setComments] = useState<CommentData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const shareUrl = window.location.href;
  const shareTitle = '';

  const fetchComments = async () => {
    if (!id) {
      setError('Invalid blog ID');
      setLoading(false);
      return;
    }
    try {
      const q = query(collection(db, 'blog-comments'), where('blogId', '==', id));
      const querySnapshot = await getDocs(q);
      const fetchedComments: CommentData[] = querySnapshot.docs
        .map((doc): CommentData | null => {
          const data = doc.data();
          if (
            typeof data.name === 'string' &&
            typeof data.textContent === 'string' &&
            data.timestamp instanceof Timestamp &&
            typeof data.blogId === 'string'
          ) {
            return {
              id: doc.id,
              name: data.name,
              textContent: data.textContent,
              timestamp: data.timestamp,
              blogId: data.blogId,
            };
          }
          console.warn(`Invalid comment data for doc ${doc.id}:`, data);
          return null;
        })
        .filter((comment): comment is CommentData => comment !== null)
        .sort((a, b) => b.timestamp.toDate().getTime() - a.timestamp.toDate().getTime());
      setComments(fetchedComments);
      setError(null);
      setLoading(false);
    } catch (error: unknown) {
      console.error('Error fetching comments:', error);
      setError('Failed to load comments. Please try again.');
      toast.error('Error loading comments.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [id]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!blog) {
    return <div className="blog-detail-page-wrapper">Blog not found</div>;
  }

  const renderComments = () => {
    if (loading) {
      return <div className="reviews-loading">Loading comments...</div>;
    }
    if (error) {
      return <div className="reviews-error">{error}</div>;
    }
    if (comments.length === 0) {
      return <div className="no-reviews">No comments yet.</div>;
    }
    return (
      <div className="reviews-scroll-area">
        {comments.map((comment) => (
          <div key={comment.id} className="showing-one-review">
            <div className="showing-reviewer-image">
              <img
                src={ProjectImages.BLANK_PROFILE}
                alt={comment.name}
                className="reviewer-image"
              />
            </div>
            <div className="showing-review-text-info">
              <div className="review-date">
                {comment.timestamp.toDate().toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
              <h4 className="reviewer-name">{comment.name || 'Anonymous User'}</h4>
              <p className="review-description">{comment.textContent}</p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="blog-detail-page-wrapper">
      <div className="blog-detail-page-container">
        <div className="blog-detail-image-container">
          <img src={blog.image} className="blog-detail-image" alt={blog.title} />
        </div>

        <div className="blog-detail-content-wrapper">
          <div className="blog-detail-date">
            <p>{blog.date} • Admin</p>
          </div>

          <h3 className="blog-detail-title">{blog.title}</h3>
          <p className="blog__description project-normal-font">
            {blog.content.map((paragraph) => (
              <span key={blog.id}>
                {paragraph}
                <br />
                <br />
              </span>
            ))}
          </p>
        </div>

        <div className="blog-details-tag-share-wrapper">
          <div className="blog-share-tag-container">
            <div className="blog-share-container">
              <span>Share: </span>
              <span className="social-share-icons">
                <FacebookShareButton url={shareUrl} title={shareTitle}>
                  <FacebookIcon size={20} round={false} />
                </FacebookShareButton>
                <TwitterShareButton url={shareUrl} title={shareTitle}>
                  <TwitterIcon size={20} round={false} />
                </TwitterShareButton>
                <WhatsappShareButton url={shareUrl} title={shareTitle}>
                  <WhatsappIcon size={20} round={false} />
                </WhatsappShareButton>
                <LinkedinShareButton url={shareUrl} title={shareTitle}>
                  <LinkedinIcon size={20} round={false} />
                </LinkedinShareButton>
              </span>
            </div>

            <div className="blog-detail-page-tags">
              <span>{blog.tag}</span>
            </div>
          </div>
        </div>

        <div className="author-section">
          <div className="author-row">
            <div className="author-image-wrapper">
              <div className="author-image-container">
                <img src={ProjectImages.BLANK_PROFILE} alt="Author" />
              </div>
            </div>
            <div className="author-info">
              <h6>Simmons</h6>
              <span>Author</span>
            </div>
          </div>
          <div className="author-description">
            Objectively productivate just in time information with dynamic
            channels. Energistically exploit seamless growth strategies after
            24/7 experiences.
          </div>
        </div>

        <div className="blog-reply-container">
          <AddingComment
            collectionType="blog-comments"
            onReset={() => {
              setError(null);
              setLoading(true);
              fetchComments(); 
            }}
          />
          <div className="showing-review-container">
            <div className="showing-review-header">
              Showing comment{comments.length !== 1 ? 's' : ''} ({comments.length})
            </div>
            {renderComments()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BlogDetailPage;
